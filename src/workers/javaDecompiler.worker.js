import { decompileClassFile } from '@jar-analyzer/jsd';
import { Unzip, UnzipInflate, UnzipPassThrough } from 'fflate';
import {
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_CLASSES,
  MAX_ARCHIVE_EXPANDED_BYTES,
  MAX_CLASS_BYTES,
  javaVersionFromClassBytes,
  readClassMajorVersion,
  safeJavaSourcePath,
} from '../utils/javaDecompiler.js';

const workerScope = self;

function asBytes(buffer) {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function unzipClassEntries(archiveBytes) {
  return new Promise((resolve, reject) => {
    const tasks = [];
    let totalClassBytes = 0;
    let classCount = 0;
    let failed = false;
    const unzip = new Unzip((file) => {
      if (!file.name.toLowerCase().endsWith('.class')) return;
      classCount += 1;
      if (classCount > MAX_ARCHIVE_CLASSES) {
        failed = true;
        reject(new Error(`This JAR contains more than ${MAX_ARCHIVE_CLASSES} class files. Use a smaller archive.`));
        return;
      }
      if (file.originalSize > MAX_CLASS_BYTES) {
        failed = true;
        reject(new Error(`Class file "${file.name}" is larger than the ${MAX_CLASS_BYTES / (1024 * 1024)} MB per-class limit.`));
        return;
      }

      const entryPromise = new Promise((resolveEntry, rejectEntry) => {
        const chunks = [];
        let entryBytes = 0;
        file.ondata = (error, chunk, final) => {
          if (error) {
            rejectEntry(new Error(`Could not read "${file.name}" from this JAR: ${error.message || error}`));
            return;
          }
          entryBytes += chunk.length;
          totalClassBytes += chunk.length;
          if (entryBytes > MAX_CLASS_BYTES || totalClassBytes > MAX_ARCHIVE_EXPANDED_BYTES) {
            failed = true;
            file.terminate();
            rejectEntry(new Error('This JAR expands beyond CodeTrove’s local processing limit. Try a smaller archive.'));
            return;
          }
          chunks.push(chunk);
          if (final) {
            const bytes = new Uint8Array(entryBytes);
            let offset = 0;
            for (const part of chunks) { bytes.set(part, offset); offset += part.length; }
            resolveEntry({ path: file.name, bytes });
          }
        };
        try { file.start(); }
        catch (error) { rejectEntry(new Error(`Could not decompress "${file.name}": ${error.message || error}`)); }
      });
      tasks.push(entryPromise);
    });

    unzip.register(UnzipInflate);
    unzip.register(UnzipPassThrough);
    try { unzip.push(archiveBytes, true); }
    catch (error) { reject(error); return; }
    if (failed) return;
    Promise.all(tasks).then(resolve).catch(reject);
  });
}

function toSource(item) {
  const bytes = asBytes(item.bytes);
  if (bytes.byteLength > MAX_CLASS_BYTES) throw new Error(`Class file exceeds the ${MAX_CLASS_BYTES / (1024 * 1024)} MB per-class limit.`);
  const majorVersion = readClassMajorVersion(bytes);
  if (majorVersion > 69) throw new Error('This class targets Java 26 or newer. The bundled browser engine currently documents support through Java 25.');
  const javaVersion = javaVersionFromClassBytes(bytes);
  const result = decompileClassFile(bytes);
  const source = typeof result === 'string' ? result : result?.source;
  if (typeof source !== 'string' || !source.trim()) throw new Error('The decompiler returned no Java source for this class.');
  return {
    path: safeJavaSourcePath(item.path),
    javaVersion,
    source,
  };
}

async function handleMessage(message) {
  const inputItems = Array.isArray(message.files) ? message.files : [];
  if (!message.archive && !inputItems.length) throw new Error('Choose a .class file or a .jar archive to decompile.');

  let classItems;
  if (message.archive) {
    const bytes = asBytes(message.archive);
    if (bytes.length > MAX_ARCHIVE_BYTES) throw new Error(`JAR files must be ${MAX_ARCHIVE_BYTES / (1024 * 1024)} MB or smaller.`);
    classItems = await unzipClassEntries(bytes);
  } else {
    classItems = inputItems.map((item) => ({ path: item.name, bytes: asBytes(item.bytes) }));
  }

  if (!classItems.length) throw new Error('No .class files were found in this input.');
  if (classItems.length > MAX_ARCHIVE_CLASSES) throw new Error(`Select no more than ${MAX_ARCHIVE_CLASSES} class files at a time.`);

  const results = [];
  const errors = [];
  for (let index = 0; index < classItems.length; index += 1) {
    try {
      results.push(toSource(classItems[index]));
    } catch (error) {
      errors.push({ path: classItems[index].path, message: error?.message || String(error) });
    }
    workerScope.postMessage({ type: 'progress', id: message.id, completed: index + 1, total: classItems.length });
  }
  if (!results.length) throw new Error(errors[0]?.message || 'No classes could be decompiled.');
  return { results, errors };
}

workerScope.onmessage = async (event) => {
  const message = event.data || {};
  if (message.type !== 'decompile') return;
  try {
    const result = await handleMessage(message);
    workerScope.postMessage({ type: 'result', id: message.id, ...result });
  } catch (error) {
    workerScope.postMessage({ type: 'error', id: message.id, message: error?.message || String(error) });
  }
};
