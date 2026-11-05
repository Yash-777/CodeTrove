export const MAX_CLASS_BYTES = 10 * 1024 * 1024;
export const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;
export const MAX_ARCHIVE_CLASSES = 500;
export const MAX_ARCHIVE_EXPANDED_BYTES = 80 * 1024 * 1024;

const CLASS_MAGIC = [0xca, 0xfe, 0xba, 0xbe];

/** Return the JVM class-file major version, rejecting truncated or non-class input. */
export function readClassMajorVersion(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  if (bytes.length < 8 || CLASS_MAGIC.some((byte, index) => bytes[index] !== byte)) {
    throw new Error('This file is not a valid Java .class file. Choose a compiled class or a JAR containing class files.');
  }
  return (bytes[6] << 8) | bytes[7];
}

/** Convert a class-file major number into the Java release most users recognize. */
export function describeJavaVersion(major) {
  const version = Number(major);
  if (!Number.isInteger(version) || version < 45) return 'Unknown Java version';
  if (version <= 48) return `Java 1.${version - 44}`;
  const release = version - 44;
  return release <= 25 ? `Java ${release}` : `Java ${release} (newer than the bundled engine’s verified range)`;
}

/** Keep generated archive paths relative and free of traversal segments. */
export function safeJavaSourcePath(value) {
  const path = String(value || '').replaceAll('\\', '/');
  const parts = path.split('/').filter((part) => part && part !== '.' && part !== '..');
  const safeParts = parts.map((part) => part.replace(/[\u0000-\u001f<>:"|?*]/g, '_'));
  if (!safeParts.length) return 'Decompiled.java';
  const last = safeParts[safeParts.length - 1];
  safeParts[safeParts.length - 1] = last.toLowerCase().endsWith('.class')
    ? `${last.slice(0, -6)}.java`
    : last.toLowerCase().endsWith('.java') ? last : `${last}.java`;
  return safeParts.join('/');
}

export function javaVersionFromClassBytes(value) {
  return describeJavaVersion(readClassMajorVersion(value));
}
