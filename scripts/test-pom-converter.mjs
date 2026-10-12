import { xmlToCustom, customToXml, formatPomXml, convert, SAMPLE_XML, SAMPLE_CUSTOM, SAMPLE_POM, PomConvertError } from '../src/utils/pomConverter.js';
let fails = 0; const eq = (name, a, b) => { const ok = a === b; if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name); if (!ok) console.log('  got:      ', JSON.stringify(a), '\n  expected: ', JSON.stringify(b)); };
const throws = (name, fn, re) => { try { fn(); fails++; console.log('FAIL', name, '(no error)'); } catch (e) { const ok = e instanceof PomConvertError && re.test(e.message); if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, '->', e.message); } };

// Unit tests for src/utils/pomConverter.js - run: npm run test:pom
// 1. the spec example, exactly
eq('spec: XML -> custom', xmlToCustom(SAMPLE_XML).output, SAMPLE_CUSTOM);
// 2. round trip
eq('spec: custom -> XML (2 spaces) equals sample', customToXml(SAMPLE_CUSTOM).output, SAMPLE_XML);
eq('round trip custom', xmlToCustom(customToXml(SAMPLE_CUSTOM).output).output, SAMPLE_CUSTOM);
// 3. indents
const x4 = customToXml(SAMPLE_CUSTOM, { indent: 4 }).output;
eq('indent 4: groupId line', x4.split('\n')[1], '    <groupId>org.springframework.boot</groupId>');
eq('indent 4: exclusion depth 3', x4.split('\n')[10], '            <groupId>org.springframework.boot</groupId>');
const x3 = customToXml(SAMPLE_CUSTOM, { indent: 3 }).output;
eq('indent 3: exclusions line', x3.split('\n')[8], '   <exclusions>');
// 4. exclusions placed before groupId (the first blueprint read the exclusion's groupId first)
const odd = '<dependency><exclusions><exclusion><groupId>x.y</groupId><artifactId>z</artifactId></exclusion></exclusions><groupId>a.b</groupId><artifactId>c</artifactId><version>1</version></dependency>';
eq('exclusions-first reads own coordinates', xmlToCustom(odd).output, "compile:false('a.b:c:1@jar') {\n    exclude group: 'x.y', module: 'z'\n}");
// 5. no version (BOM managed) / classifier without version
eq('no version', xmlToCustom('<dependency><groupId>g</groupId><artifactId>a</artifactId></dependency>').output, "compile:false('g:a@jar')");
eq('classifier without version', xmlToCustom('<dependency><groupId>g</groupId><artifactId>a</artifactId><classifier>tests</classifier></dependency>').output, "compile:false('g:a::tests@jar')");
eq('custom g:a::cls parses', customToXml("test:false('g:a::tests@test-jar')").output.includes('<classifier>tests</classifier>') && !customToXml("test:false('g:a::tests@test-jar')").output.includes('<version>'), true);
// 6. several dependencies + comments + entities
const many = '<dependencies><!-- web --><dependency><groupId>a</groupId><artifactId>b</artifactId><version>1</version></dependency><dependency><groupId>c</groupId><artifactId>d</artifactId><version>${d.version}</version><scope>test</scope></dependency></dependencies>';
const m = xmlToCustom(many); eq('many: count', m.count, 2); eq('many: output', m.output, "compile:false('a:b:1@jar')\ntest:false('c:d:${d.version}@jar')");
eq('entities encode', customToXml("compile:false('a&b:c<d:1')").output.includes('<groupId>a&amp;b</groupId>'), true);
// 7. custom parsing flexibility
const flex = `// Custom Format Template\n/* two */\nruntime:true("g:a:1@jar") {\n  exclude group: "x", module: "y",\n  exclude group: 'p', module: 'q'\n}\ntest:false('h:b:2@jar')`;
const f = customToXml(flex); eq('flex: count', f.count, 2); eq('flex: both exclusions', (f.output.match(/<exclusion>/g) || []).length, 2);
// 8. errors
throws('error: no dependency', () => xmlToCustom('<foo/>'), /No <dependency>/);
throws('error: missing artifactId', () => xmlToCustom('<dependency><groupId>g</groupId></dependency>'), /artifactId/);
throws('error: bad optional', () => xmlToCustom('<dependency><groupId>g</groupId><artifactId>a</artifactId><optional>maybe</optional></dependency>'), /true or false/);
throws('error: garbage custom', () => customToXml('hello world'), /Line 1: expected scope:optional/);
throws('error: line number', () => customToXml("compile:false('a:b:1@jar')\noops"), /Line 2/);
throws('error: too many colons', () => customToXml("compile:false('a:b:1:c:d@jar')"), /too many/);
throws('error: missing artifact', () => customToXml("compile:false('onlygroup')"), /at least groupId:artifactId/);
throws('error: unclosed brace', () => customToXml("compile:false('a:b:1@jar') { exclude group: 'x', module: 'y'"), /closing/);
throws('error: empty', () => convert('xml-to-custom', '  '), /Nothing to convert/);
// 9. warnings
eq('warning for systemPath', xmlToCustom('<dependency><groupId>g</groupId><artifactId>a</artifactId><scope>system</scope><systemPath>/x</systemPath></dependency>').warnings[0], '<systemPath> has no place in the custom format and was skipped.');
// 10. POM formatter
const pom = formatPomXml(SAMPLE_POM, 2).output.split('\n');
eq('pom: declaration first', pom[0], '<?xml version="1.0" encoding="UTF-8"?>');
eq('pom: attrs normalised', pom[1], '<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">');
eq('pom: leaf inline', pom[2], '  <modelVersion>4.0.0</modelVersion>');
eq('pom: nested depth', pom.find((l) => l.includes('spring-boot-starter-web')), '      <artifactId>spring-boot-starter-web</artifactId>');
eq('pom: 4 spaces', formatPomXml('<a><b>1</b></a>', 4).output, '<a>\n    <b>1</b>\n</a>');
eq('pom: comment kept', formatPomXml('<a><!-- hi --><b/></a>', 2).output, '<a>\n  <!-- hi -->\n  <b/>\n</a>');
eq('pom: idempotent', formatPomXml(formatPomXml(SAMPLE_POM, 3).output, 3).output, formatPomXml(SAMPLE_POM, 3).output);
throws('pom: mismatch', () => formatPomXml('<a><b></a>'), /does not match/);
throws('pom: unclosed', () => formatPomXml('<a><b>'), /never closed/);
console.log(fails === 0 ? '\nALL TESTS PASSED' : `\n${fails} FAILED`); process.exit(fails ? 1 : 0);
