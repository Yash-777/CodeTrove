/**
 * Metadata-driven documentation information architecture.
 * Hierarchy: Section -> Topic -> Subtopic -> Page (with deeper nodes supported).
 * New documentation pages live under src/data/topics/<path>/content.md.
 */

import { CATEGORIES } from './topics/index.js';
import { hasNavigationContent } from './topics/contentLoader.js';

const humanize = (value) => value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const tree = [
  {
    key: 'languages', label: 'Programming Languages', children: [
      { key: 'java', label: 'Java', data: 'content.md', children: [
        { key: 'core', label: 'Core', children: [
          { key: 'oop', label: 'Object-Oriented Programming', data: 'content.md', pages: { 'interface': 'Interfaces', 'class': 'Classes', 'object': 'Objects', 'encapsulation': 'Encapsulation (Data Hiding)', 'inheritance': 'Inheritance (Code Reuse)', 'abstraction': 'Abstraction (Hiding Complexity)', 'polymorphism': 'Polymorphism (Many Forms)' } },
          { key: 'language-basics', label: 'Language Basics', pages: {'generics': 'Generics', 'collections': 'Collections', 'exceptions': 'Exceptions', 'optional': {label: 'Optional', contentKey: 'java/optional'}, 'records': {label: 'Records', contentKey: 'java/records'}, 'streams': {label: 'Streams', contentKey: 'java/streams'}} },
          { key: 'concurrency', label: 'Concurrency', pages: {'threads': 'Threads', 'executors': 'Executors', 'completable-future': 'Completable Future', 'synchronization': 'Synchronization', 'locks': 'Locks'} },
          { key: 'jvm', label: 'JVM', pages: {'jvm-memory': 'Jvm Memory', 'garbage-collection': 'Garbage Collection', 'class-loading': 'Class Loading', 'jvm-tuning': 'Jvm Tuning'} },
        ]},
        { key: 'advanced', label: 'Advanced', children: [
          { key: 'performance', label: 'Performance', pages: {'profiling': 'Profiling', 'heap-dumps': 'Heap Dumps', 'thread-dumps': 'Thread Dumps', 'performance-tuning': 'Performance Tuning'} },
          { key: 'modern-java', label: 'Modern Java', pages: {'functional-programming': 'Functional Programming', 'virtual-threads': 'Virtual Threads', 'pattern-matching': 'Pattern Matching', 'sealed-classes': 'Sealed Classes'} },
        ]},
      ]},
      { key: 'javascript', label: 'JavaScript', children: [
        { key: 'language', label: 'Language', pages: {'types': 'Types', 'scope-closures': 'Scope Closures', 'prototypes': 'Prototypes', 'modules': 'Modules', 'promises': 'Promises', 'event-loop': 'Event Loop'} },
        { key: 'advanced', label: 'Advanced', pages: {'async-programming': 'Async Programming', 'memory-management': 'Memory Management', 'performance': 'Performance', 'web-workers': 'Web Workers'} },
      ]},
      { key: 'kotlin', label: 'Kotlin', children: [
        { key: 'language-basics', label: 'Language Basics', pages: {
          'syntax': 'Syntax',
          'variables-types': 'Variables & Types',
          'null-safety': 'Null Safety',
          'functions': 'Functions',
          'control-flow': 'Control Flow',
          'collections': 'Collections',
        } },
        { key: 'object-oriented', label: 'Object-Oriented Programming', pages: {
          'classes-objects': 'Classes & Objects',
          'inheritance': 'Inheritance',
          'interfaces': 'Interfaces',
          'data-classes': 'Data Classes',
          'sealed-classes': 'Sealed Classes',
        } },
        { key: 'advanced', label: 'Advanced', pages: {
          'extension-functions': 'Extension Functions',
          'generics': 'Generics',
          'coroutines': 'Coroutines',
          'flow': 'Flow',
          'delegation': 'Delegation',
        } },
      ]},
      { key: 'typescript', label: 'TypeScript', pages: {'types-generics': 'Types Generics', 'interfaces': 'Interfaces', 'utility-types': 'Utility Types', 'tsconfig': 'Tsconfig'} },
      { key: 'web', label: 'Web', children: [
        { key: 'html', label: 'HTML', pages: {'semantic-html': 'Semantic Html', 'forms': 'Forms', 'accessibility': 'Accessibility'} },
        { key: 'css', label: 'CSS', pages: {'layout': 'Layout', 'flexbox': 'Flexbox', 'grid': 'Grid', 'responsive-design': 'Responsive Design'} },
      ]},
      { key: 'nodejs', label: 'Node.js', pages: {'modules': 'Modules', 'event-loop': 'Event Loop', 'express': 'Express', 'streams': 'Streams', 'security': 'Security'} },
    ],
  },
  {
    key: 'interview-prep', label: 'Interview Prep', children: [
      { key: 'java', label: 'Java', children: [
        { key: 'core', label: 'Core', pages: {'core-interview-questions': 'Core Interview Questions', 'oop-interview-questions': 'Oop Interview Questions', 'collections-interview-questions': 'Collections Interview Questions', 'concurrency-interview-questions': 'Concurrency Interview Questions', 'jvm-interview-questions': 'Jvm Interview Questions'} },
        { key: 'advanced', label: 'Advanced', pages: {'java-advanced-interview-questions': 'Java Advanced Interview Questions', 'performance-interview-questions': 'Performance Interview Questions', 'design-patterns-interview-questions': 'Design Patterns Interview Questions'} },
      ]},
      { key: 'sql', label: 'SQL', pages: {'sql-interview-questions': 'Sql Interview Questions', 'joins-and-indexes': 'Joins And Indexes', 'transactions-and-locking': 'Transactions And Locking', 'query-tuning': 'Query Tuning'} },
      { key: 'microservices', label: 'Microservices', children: [
        { key: 'project-flow', label: 'Project Flow & Architecture', pages: {'microservice-project-flow-architecture': 'Microservice Project Flow Architecture', 'microservice-architecture-deep-dive': 'Microservice Architecture Deep Dive'}, children: [
          { key: 'api-gateway-idempotency', label: 'API Gateway & Idempotency', pages: {'api-gateway-idempotency': 'Api Gateway Idempotency'} },
          { key: 'eureka-service-discovery', label: 'Eureka Service Discovery (Registry)', children: [
            { key: 'mechanics-client-lifecycle', label: 'Eureka Server Mechanics & Client Lifecycle', pages: {'eureka-mechanics-client-lifecycle': 'Eureka Mechanics Client Lifecycle'} },
            { key: 'resilience-failure-scenarios', label: 'Resilience & Failure Scenarios', pages: {'eureka-resilience-failure-scenarios': 'Eureka Resilience Failure Scenarios'} },
            { key: 'eureka-vs-zookeeper-consul', label: 'Eureka vs Zookeeper / Consul', pages: {'eureka-vs-zookeeper-consul': 'Eureka Vs Zookeeper Consul'} },
          ] },
          { key: 'zipkin-sleuth', label: 'Zipkin & Sleuth', pages: {'zipkin-sleuth': 'Zipkin Sleuth'} },
          { key: 'kafka', label: 'Kafka', children: [
            { key: 'topic-partition-broker', label: 'Topic, Partition & Broker Relationship', pages: {'kafka-topic-partition-broker': 'Kafka Topic Partition Broker'} },
            { key: 'producer-consumer-offsets', label: 'Producer & Consumer Mechanics / Offset Management', pages: {'kafka-producer-consumer-offsets': 'Kafka Producer Consumer Offsets'} },
            { key: 'zookeeper-vs-kraft', label: 'ZooKeeper vs KRaft', pages: {'kafka-zookeeper-vs-kraft': 'Kafka Zookeeper Vs Kraft'} },
            { key: 'sync-vs-async', label: 'Synchronous vs Asynchronous Communication', pages: {'kafka-sync-vs-async': 'Kafka Sync Vs Async'} },
          ] },
          { key: 'saga-pattern', label: 'Saga Design Pattern', children: [
            { key: 'choreography', label: 'Choreography (Decentralized)', pages: {'saga-choreography': 'Saga Choreography'} },
            { key: 'orchestration', label: 'Orchestration (Centralized)', pages: {'saga-orchestration': 'Saga Orchestration'} },
          ] },
          { key: 'config-server-vault', label: 'Config Server vs Vault', pages: {'config-server-vs-vault': {label: 'Config Server vs Vault', contentKey: 'interview-prep/microservices/project-flow/config-server-vs-vault/config-server-vs-vault'}} },
          { key: 'circuit-breaker-fallback', label: 'Circuit Breaker & Fallback', pages: {'circuit-breaker-fallback': 'Circuit Breaker Fallback'} },
        ] },
        { key: 'distributed-systems', label: 'Distributed Systems', pages: {'service-discovery': 'Service Discovery', 'config-server-vault': 'Config Server Vault', 'circuit-breaker': 'Circuit Breaker', 'distributed-tracing': 'Distributed Tracing', 'metrics-observability': 'Metrics Observability'} },
        { key: 'messaging', label: 'Messaging', pages: {'kafka': 'Kafka', 'kafka-transactions': 'Kafka Transactions', 'message-brokers': 'Message Brokers'} },
      ]},
      { key: 'javascript', label: 'JavaScript', pages: {'javascript-interview-questions': 'Javascript Interview Questions', 'frontend-architecture-interview': 'Frontend Architecture Interview'} },
      { key: 'system-design', label: 'System Design', pages: {'system-design-fundamentals': 'System Design Fundamentals', 'scalability': 'Scalability', 'availability-reliability': 'Availability Reliability', 'caching-strategies': 'Caching Strategies', 'rate-limiting': 'Rate Limiting'} },
      { key: 'behavioral', label: 'Senior Engineer', pages: {'pr-impact-beyond-jira': 'Pr Impact Beyond Jira', 'code-review': 'Code Review', 'refactoring': 'Refactoring', 'technical-leadership': 'Technical Leadership'} },
    ],
  },
  {
    key: 'frontend-frameworks', label: 'Frontend Frameworks', children: [
      { key: 'angularjs', label: 'AngularJS', children: [
        { key: 'fundamentals', label: 'Fundamentals', pages: {
          'architecture': 'Architecture',
          'modules': 'Modules',
          'controllers': 'Controllers',
          'scope': 'Scope',
          'dependency-injection': 'Dependency Injection',
        } },
        { key: 'templates', label: 'Templates & Data Binding', pages: {
          'expressions': 'Expressions',
          'directives': 'Directives',
          'data-binding': 'Data Binding',
          'forms': 'Forms',
        } },
        { key: 'services', label: 'Services & Routing', pages: {
          'services': 'Services',
          'routing': 'Routing',
          'http': '$http & APIs',
          'promises': 'Promises',
        } },
      ] },
      { key: 'angular', label: 'Angular', children: [
        { key: 'fundamentals', label: 'Fundamentals', pages: {
          'architecture': 'Architecture',
          'components': 'Components',
          'modules': 'Modules',
          'templates': 'Templates',
          'dependency-injection': 'Dependency Injection',
        } },
        { key: 'core-concepts', label: 'Core Concepts', pages: {
          'data-binding': 'Data Binding',
          'directives': 'Directives',
          'pipes': 'Pipes',
          'lifecycle-hooks': 'Lifecycle Hooks',
          'services': 'Services',
        } },
        { key: 'advanced', label: 'Advanced', pages: {
          'routing': 'Routing',
          'forms': 'Forms',
          'http-client': 'HttpClient',
          'rxjs-observables': 'RxJS & Observables',
          'state-management': 'State Management',
        } },
      ] },
      { key: 'react', label: 'React', children: [
        { key: 'fundamentals', label: 'Fundamentals', pages: {
          'jsx': 'JSX',
          'components': 'Components',
          'props': 'Props',
          'state': 'State',
          'events': 'Events',
        } },
        { key: 'hooks', label: 'Hooks', pages: {
          'use-state': 'useState',
          'use-effect': 'useEffect',
          'use-context': 'useContext',
          'use-reducer': 'useReducer',
          'custom-hooks': 'Custom Hooks',
        } },
        { key: 'advanced', label: 'Advanced', pages: {
          'routing': 'Routing',
          'forms': 'Forms',
          'api-integration': 'API Integration',
          'state-management': 'State Management',
          'performance': 'Performance Optimization',
        } },
      ] },
    ],
  },
  {
    key: 'backend', label: 'Backend & Spring', children: [
      { key: 'spring', label: 'Spring Framework', pages: {'ioc-di': 'Ioc Di', 'bean-lifecycle': 'Bean Lifecycle', 'application-context': 'Application Context', 'aop': 'Aop', 'interceptors': 'Interceptors', 'filters': 'Filters'} },
      { key: 'spring-boot', label: 'Spring Boot', pages: {'auto-configuration': 'Auto Configuration', 'configuration-properties': 'Configuration Properties', 'actuator': 'Actuator', 'profiles': 'Profiles', 'starters': 'Starters', 'exception-handling': {label: 'Exception Handling', contentKey: 'backend/spring-boot/exception-handling'}} },
      { key: 'spring-web', label: 'Spring Web', pages: {'dispatcher-servlet': 'Dispatcher Servlet', 'rest-controllers': 'Rest Controllers', 'validation': 'Validation', 'global-exception-handling': 'Global Exception Handling'} },
      { key: 'spring-security', label: 'Spring Security', pages: {'security-filters': 'Security Filters', 'authentication': 'Authentication', 'authorization': 'Authorization', 'preauthorize': 'Preauthorize', 'oauth2-jwt': 'Oauth2 Jwt'} },
      { key: 'spring-data', label: 'Spring Data', pages: {'repositories': 'Repositories', 'transactions': 'Transactions', 'auditing': 'Auditing', 'specifications': 'Specifications'} },
      { key: 'hibernate-jpa', label: 'Hibernate / JPA', pages: {'entity-mapping': 'Entity Mapping', 'entity-lifecycle': 'Entity Lifecycle', 'fetch-types': 'Fetch Types', 'n-plus-one': 'N Plus One', 'optimistic-locking': 'Optimistic Locking', 'pessimistic-locking': 'Pessimistic Locking'} },
    ],
  },
  {
    key: 'api-integration', label: 'API & Integration', children: [
      { key: 'api-gateway', label: 'API Gateway', pages: {'gateway-pattern': 'Gateway Pattern', 'routing': 'Routing', 'authentication-at-gateway': 'Authentication At Gateway', 'gateway-rate-limiting': 'Gateway Rate Limiting'} },
      { key: 'load-balancing', label: 'Load Balancing', pages: {'load-balancer-basics': 'Load Balancer Basics', 'client-side-load-balancing': 'Client Side Load Balancing', 'health-checks': 'Health Checks'} },
      { key: 'rest', label: 'REST APIs', pages: {'rest-principles': 'Rest Principles', 'http-methods': 'Http Methods', 'status-codes': 'Status Codes', 'pagination': 'Pagination', 'versioning': 'Versioning'} },
      { key: 'resilience', label: 'Resilience', pages: {'timeouts-retries': 'Timeouts Retries', 'idempotency': {label: 'Idempotency', contentKey: 'interview-prep/microservices/project-flow/api-gateway-idempotency/api-gateway-idempotency'}, 'rate-limiting': {label: 'Rate Limiting', contentKey: 'interview-prep/system-design/rate-limiting'}, 'dos-protection': 'Dos Protection', 'bulkheads': 'Bulkheads'} },
      { key: 'documentation', label: 'API Documentation', pages: {'openapi-swagger': 'Openapi Swagger', 'postman': 'Postman'} },
    ],
  },
  {
    key: 'databases', label: 'Databases & Storage', children: [
      { key: 'sql', label: 'SQL', pages: {'relational-model': 'Relational Model', 'normalization': 'Normalization', 'indexes': 'Indexes', 'sql-data-pages': 'Sql Data Pages', 'joins': 'Joins', 'transactions': 'Transactions', 'deadlocks': 'Deadlocks'} },
      { key: 'nosql', label: 'NoSQL', pages: {'sql-vs-nosql': 'Sql Vs Nosql', 'document-databases': 'Document Databases', 'key-value': 'Key Value', 'eventual-consistency': 'Eventual Consistency'} },
      { key: 'caching', label: 'Caching', pages: {'cache-aside': 'Cache Aside', 'redis': 'Redis', 'hazelcast': 'Hazelcast', 'cache-invalidation': 'Cache Invalidation'} },
      { key: 'file-storage', label: 'File Storage', pages: {'s3': 'S3', 'firestore-storage': 'Firestore Storage', 'object-storage-patterns': 'Object Storage Patterns'} },
    ],
  },
  {
    key: 'messaging', label: 'Messaging & Streaming', children: [
      { key: 'kafka', label: 'Apache Kafka', pages: {'architecture': 'Architecture', 'producers-consumers': 'Producers Consumers', 'partitions-offsets': 'Partitions Offsets', 'consumer-groups': 'Consumer Groups', 'delivery-semantics': 'Delivery Semantics', 'transactions': 'Transactions'} },
      { key: 'rabbitmq', label: 'RabbitMQ', pages: {'exchanges-queues': 'Exchanges Queues', 'acknowledgements': 'Acknowledgements', 'routing': 'Routing'} },
      { key: 'patterns', label: 'Messaging Patterns', pages: {'outbox-pattern': 'Outbox Pattern', 'saga-pattern': 'Saga Pattern', 'dead-letter-queues': 'Dead Letter Queues', 'exactly-once-processing': 'Exactly Once Processing'} },
    ],
  },
  {
    key: 'distributed-systems', label: 'Distributed Systems', children: [
      { key: 'service-discovery', label: 'Service Discovery', pages: {'eureka-server': 'Eureka Server', 'eureka-client': 'Eureka Client', 'service-registry': 'Service Registry'} },
      { key: 'configuration', label: 'Configuration', pages: {'config-server': 'Config Server', 'vault': 'Vault', 'secrets-management': 'Secrets Management'} },
      { key: 'resilience', label: 'Resilience Patterns', pages: {'circuit-breaker': 'Circuit Breaker', 'retry': 'Retry', 'timeout': 'Timeout', 'fallback': 'Fallback'} },
      { key: 'observability', label: 'Observability', pages: {'logs': 'Logs', 'distributed-tracing': 'Distributed Tracing', 'sleuth': 'Sleuth', 'metrics': 'Metrics', 'health-checks': 'Health Checks'} },
      { key: 'scaling', label: 'Scaling', pages: {'horizontal-scaling': 'Horizontal Scaling', 'vertical-scaling': 'Vertical Scaling', 'autoscaling': 'Autoscaling', 'stateless-services': 'Stateless Services'} },
    ],
  },
  {
    key: 'security', label: 'Security', children: [
      { key: 'application-security', label: 'Application Security', pages: {'owasp-top-10': 'Owasp Top 10', 'input-validation': 'Input Validation', 'csrf': 'Csrf', 'cors': 'Cors', 'secure-headers': 'Secure Headers'} },
      { key: 'identity', label: 'Identity & Access', pages: {'oauth2': 'Oauth2', 'openid-connect': 'Openid Connect', 'jwt': 'Jwt', 'rbac': 'Rbac', 'secrets': 'Secrets'} },
      { key: 'api-security', label: 'API Security', pages: {'api-authentication': 'Api Authentication', 'api-authorization': 'Api Authorization', 'token-validation': 'Token Validation', 'dos-mitigation': 'Dos Mitigation'} },
      { key: 'dependency-security', label: 'Dependency Security', pages: {'dependency-scanning': 'Dependency Scanning', 'vulnerability-management': 'Vulnerability Management'} },
    ],
  },
  {
    key: 'testing-quality', label: 'Testing & Code Quality', children: [
      { key: 'unit-testing', label: 'Unit Testing', pages: {'junit': 'Junit', 'mockito': 'Mockito', 'test-doubles': 'Test Doubles', 'test-coverage': 'Test Coverage'} },
      { key: 'integration-testing', label: 'Integration Testing', pages: {'spring-boot-tests': 'Spring Boot Tests', 'testcontainers': 'Testcontainers', 'contract-testing': 'Contract Testing'} },
      { key: 'api-testing', label: 'API Testing', pages: {'postman-testing': 'Postman Testing', 'swagger-testing': 'Swagger Testing'} },
      { key: 'quality', label: 'Code Quality', pages: {'sonarqube': 'Sonarqube', 'linting': 'Linting', 'static-analysis': 'Static Analysis', 'quality-gates': 'Quality Gates'} },
      { key: 'performance', label: 'Performance Testing', pages: {'load-testing': 'Load Testing', 'stress-testing': 'Stress Testing', 'profiling': 'Profiling'} },
    ],
  },
  {
    key: 'build-devops', label: 'Build, DevOps & Cloud', children: [
      { key: 'build-tools', label: 'Build Tools', pages: {'maven': 'Maven', 'gradle': 'Gradle', 'dependency-management': 'Dependency Management'} },
      { key: 'database-migrations', label: 'Database Migrations', pages: {'flyway': 'Flyway', 'liquibase': 'Liquibase', 'migration-strategy': 'Migration Strategy'} },
      { key: 'containers', label: 'Containers', pages: {'docker': 'Docker', 'docker-compose': 'Docker Compose', 'container-images': 'Container Images'} },
      { key: 'orchestration', label: 'Kubernetes', pages: {'pods': 'Pods', 'deployments': 'Deployments', 'services': 'Services', 'configmaps-secrets': 'Configmaps Secrets', 'ingress': 'Ingress', 'autoscaling': 'Autoscaling'} },
      { key: 'ci-cd', label: 'CI/CD', pages: {'pipeline-basics': 'Pipeline Basics', 'github-actions': 'Github Actions', 'deployment-strategies': 'Deployment Strategies'} },
      { key: 'cloud', label: 'Cloud', pages: {'aws-basics': 'Aws Basics', 'compute': 'Compute', 'managed-databases': 'Managed Databases', 'object-storage': 'Object Storage'} },
    ],
  },
  {
    key: 'architecture', label: 'Architecture & Design', children: [
      { key: 'software-architecture', label: 'Software Architecture', pages: {'layered-architecture': 'Layered Architecture', 'hexagonal-architecture': 'Hexagonal Architecture', 'clean-architecture': 'Clean Architecture', 'modular-monolith': 'Modular Monolith'} },
      { key: 'microservices', label: 'Microservices', pages: {'architecture-deep-dive': {label: 'Microservice Architecture Deep Dive', contentKey: 'interview-prep/microservices/project-flow/microservice-architecture-deep-dive'}, 'microservice-boundaries': 'Microservice Boundaries', 'api-composition': 'Api Composition', 'data-ownership': 'Data Ownership', 'distributed-transactions': 'Distributed Transactions', 'service-versioning': 'Service Versioning'} },
      { key: 'design-patterns', label: 'Design Patterns', pages: {'creational-patterns': 'Creational Patterns', 'structural-patterns': 'Structural Patterns', 'behavioral-patterns': 'Behavioral Patterns', 'enterprise-patterns': 'Enterprise Patterns'} },
      { key: 'system-design', label: 'System Design', pages: {'capacity-planning': 'Capacity Planning', 'consistency': 'Consistency', 'partitioning': 'Partitioning', 'sharding': 'Sharding', 'disaster-recovery': 'Disaster Recovery'} },
    ],
  },
  {
    key: 'git-collaboration', label: 'Git & Collaboration', children: [
      { key: 'git', label: 'Git', pages: {'branching': 'Branching', 'merge-rebase': 'Merge Rebase', 'cherry-pick': 'Cherry Pick', 'reset-revert': 'Reset Revert', 'bisect': 'Bisect'} },
      { key: 'pull-requests', label: 'Pull Requests', pages: {'pr-review': 'Pr Review', 'review-checklist': 'Review Checklist', 'commit-strategy': 'Commit Strategy'} },
      { key: 'source-control', label: 'Source Control', pages: {'release-branching': 'Release Branching', 'semantic-versioning': 'Semantic Versioning'} },
    ],
  },
  {
    key: 'tools', label: 'Developer Tools', children: [
      { key: 'api-tools', label: 'API Tools', pages: {'postman': 'Postman', 'swagger-ui': 'Swagger Ui', 'curl': 'Curl'} },
      { key: 'database-tools', label: 'Database Tools', pages: {'database-clients': 'Database Clients', 'query-analyzers': 'Query Analyzers'} },
      { key: 'developer-tools', label: 'Developer Workflow', pages: {'ide-debugging': 'Ide Debugging', 'terminal-tools': 'Terminal Tools', 'http-debugging': 'Http Debugging'} },
    ],
  },
  {
    key: 'payment-service-provider', label: 'Payment Service Provider', children: [
      { key: 'stripe', label: 'Stripe', pages: {} },
      { key: 'billdesk', label: 'Billdesk', pages: {} },
      { key: 'razor', label: 'Razor', pages: {} },
      { key: 'boxpay', label: 'Boxpay', pages: {} },
    ],
  },
];

const legacyPlatform = ['text', 'nodejs', 'json', 'jwt', 'git', 'email'].map((categoryKey) => {
  const category = CATEGORIES.find((item) => item.key === categoryKey);
  return {
    key: categoryKey,
    label: category?.label || humanize(categoryKey),
    pages: Object.fromEntries((category?.topics || []).map((item) => [item.slug, {
      label: item.title,
      contentKey: item.contentKey || `${categoryKey}/${item.slug}`,
      keywords: item.tags || [],
    }])),
  };
});

tree.push({ key: 'platform', label: 'Platform', children: legacyPlatform });

function normalizeNode(node, parentPath = []) {
  const path = [...parentPath, node.key];
  const children = (node.children || []).map((child) => normalizeNode(child, path));
  const pages = Object.entries(node.pages || {}).map(([key, value]) => {
    const item = typeof value === 'string' ? { key, label: value } : { ...value, key };
    return {
      ...item,
      key: item.key,
      label: item.label || humanize(item.key),
      path: [...path, item.key].join('/'),
      contentKey: item.contentKey || [...path, item.key].join('/'),
      type: 'page',
    };
  });
  const contentKey = node.contentKey || path.join('/');
  return {
    ...node,
    data: node.data || 'content.md',
    contentKey,
    hasContent: hasNavigationContent(contentKey),
    path: path.join('/'),
    children,
    pages,
    type: 'node',
  };
}

export const NAVIGATION_TREE = tree.map((section) => ({ ...normalizeNode(section), type: 'section' }));

export function flattenNavigation() {
  const pages = [];
  function visit(node, ancestors = []) {
    const next = [...ancestors, { key: node.key, label: node.label, path: node.path, type: node.type }];
    (node.pages || []).forEach((page) => pages.push({ ...page, ancestors: next, section: next[0] }));
    (node.children || []).forEach((child) => visit(child, next));
  }
  NAVIGATION_TREE.forEach((section) => visit(section));
  return pages;
}

export const NAVIGATION_PAGES = flattenNavigation();

export function getNavigationPage(path) {
  return NAVIGATION_PAGES.find((page) => page.path === path);
}

export function getNavigationNode(path) {
  let match;
  function visit(node) {
    if (node.path === path) {
      match = node;
      return;
    }
    (node.children || []).forEach((child) => {
      if (!match) visit(child);
    });
  }
  NAVIGATION_TREE.forEach((section) => {
    if (!match) visit(section);
  });
  return match;
}

export function getNavigationSearchResults(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return NAVIGATION_PAGES.filter((page) => {
    const haystack = [page.label, page.key, page.contentKey, ...page.ancestors.map((item) => `${item.label} ${item.key}`)].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}
