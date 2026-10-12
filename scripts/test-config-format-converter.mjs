import { parseConfig, stringifyConfig, convertConfig, formatConfig, SAMPLE_PROPERTIES, ConfigConvertError } from '../src/utils/configFormatConverter.js';
let failures = 0;
function check(name, condition) { console.log(condition ? 'PASS' : 'FAIL', name); if (!condition) failures++; }
function equal(name, actual, expected) { check(name, actual === expected); if (actual !== expected) console.log('  actual:', actual, '\n  expected:', expected); }
function throws(name, fn) { try { fn(); check(name, false); } catch (error) { check(name, error instanceof ConfigConvertError); } }

const flat = parseConfig('server.port=8081\nspring.application.name=codetrove', 'properties');
check('properties parse keeps flat keys by default', flat['server.port'] === 8081 && flat['spring.application.name'] === 'codetrove');
const nested = parseConfig('server.port=8081\nconfig[0].name=Hibernate ORM\nconfig[1].name=Flyway', 'properties', { writeNestedKeys: true });
check('nested keys create objects and arrays', nested.server.port === 8081 && nested.config[0].name === 'Hibernate ORM' && nested.config[1].name === 'Flyway');
const yaml = convertConfig(SAMPLE_PROPERTIES, 'properties', 'yaml', { writeNestedKeys: true }).output;
check('properties -> YAML includes nested server config', yaml.includes('server:') && yaml.includes('port: 8081'));
const json = convertConfig(SAMPLE_PROPERTIES, 'properties', 'json', { writeNestedKeys: true, indent: 4 }).output;
check('properties -> JSON emits formatted JSON', JSON.parse(json).config.length === 3 && json.includes('\n    "server"'));
const props = convertConfig('server:\n  port: 8081\nspring:\n  application:\n    name: codetrove', 'yaml', 'properties').output;
check('YAML -> properties flattens nested keys', props.includes('server.port=8081') && props.includes('spring.application.name=codetrove'));
const roundTrip = convertConfig(convertConfig(SAMPLE_PROPERTIES, 'properties', 'json', { writeNestedKeys: true }).output, 'json', 'properties').output;
check('Properties -> JSON -> properties round trip retains indexed config keys', roundTrip.includes('config[0].name=Hibernate ORM') && roundTrip.includes('config[2].name=Flyway'));
equal('JSON formatting uses configured indent', formatConfig('{"a":1}', 'json', { indent: 3 }), '{\n   "a": 1\n}');
throws('invalid JSON reports validation error', () => parseConfig('{bad json}', 'json'));
throws('empty source is rejected', () => parseConfig('', 'properties'));
if (failures) process.exitCode = 1;
