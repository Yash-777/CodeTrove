/**
 * Metadata-driven documentation information architecture.
 * Hierarchy: Section -> Topic -> Subtopic -> Page (with deeper nodes supported).
 * New documentation pages live under src/data/topics/<path>/content.md.
 */

import { CATEGORIES } from './topics/index.js';

const humanize = (value) => value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const tree = [
  {
    key: 'languages', label: 'Languages', children: [
      { key: 'java', label: 'Java', children: [
        { key: 'core', label: 'Core', children: [
          { key: 'oop', label: 'Object-Oriented Programming', pages: ['class', 'object', 'encapsulation', 'abstraction', 'polymorphism'] },
          { key: 'language-basics', label: 'Language Basics', pages: ['generics', 'collections', 'exceptions', 'optional', 'records', 'streams'] },
          { key: 'concurrency', label: 'Concurrency', pages: ['threads', 'executors', 'completable-future', 'synchronization', 'locks'] },
          { key: 'jvm', label: 'JVM', pages: ['jvm-memory', 'garbage-collection', 'class-loading', 'jvm-tuning'] },
        ]},
        { key: 'advanced', label: 'Advanced', children: [
          { key: 'performance', label: 'Performance', pages: ['profiling', 'heap-dumps', 'thread-dumps', 'performance-tuning'] },
          { key: 'modern-java', label: 'Modern Java', pages: ['functional-programming', 'virtual-threads', 'pattern-matching', 'sealed-classes'] },
        ]},
      ]},
      { key: 'javascript', label: 'JavaScript', children: [
        { key: 'language', label: 'Language', pages: ['types', 'scope-closures', 'prototypes', 'modules', 'promises', 'event-loop'] },
        { key: 'advanced', label: 'Advanced', pages: ['async-programming', 'memory-management', 'performance', 'web-workers'] },
      ]},
      { key: 'typescript', label: 'TypeScript', pages: ['types-generics', 'interfaces', 'utility-types', 'tsconfig'] },
      { key: 'web', label: 'Web', children: [
        { key: 'html', label: 'HTML', pages: ['semantic-html', 'forms', 'accessibility'] },
        { key: 'css', label: 'CSS', pages: ['layout', 'flexbox', 'grid', 'responsive-design'] },
      ]},
      { key: 'nodejs', label: 'Node.js', pages: ['modules', 'event-loop', 'express', 'streams', 'security'] },
    ],
  },
  {
    key: 'interview-prep', label: 'Interview Prep', children: [
      { key: 'java', label: 'Java', children: [
        { key: 'core', label: 'Core', pages: ['core-interview-questions', 'oop-interview-questions', 'collections-interview-questions', 'concurrency-interview-questions', 'jvm-interview-questions'] },
        { key: 'advanced', label: 'Advanced', pages: ['java-advanced-interview-questions', 'performance-interview-questions', 'design-patterns-interview-questions'] },
      ]},
      { key: 'sql', label: 'SQL', pages: ['sql-interview-questions', 'joins-and-indexes', 'transactions-and-locking', 'query-tuning'] },
      { key: 'microservices', label: 'Microservices', children: [
        { key: 'project-flow', label: 'Project Flow & Architecture', pages: ['microservice-project-flow-architecture'] },
        { key: 'distributed-systems', label: 'Distributed Systems', pages: ['service-discovery', 'config-server-vault', 'circuit-breaker', 'distributed-tracing', 'metrics-observability'] },
        { key: 'messaging', label: 'Messaging', pages: ['kafka', 'kafka-transactions', 'message-brokers'] },
      ]},
      { key: 'javascript', label: 'JavaScript', pages: ['javascript-interview-questions', 'frontend-architecture-interview'] },
      { key: 'system-design', label: 'System Design', pages: ['system-design-fundamentals', 'scalability', 'availability-reliability', 'caching-strategies', 'rate-limiting'] },
      { key: 'behavioral', label: 'Senior Engineer', pages: ['pr-impact-beyond-jira', 'code-review', 'refactoring', 'technical-leadership'] },
    ],
  },
  {
    key: 'backend', label: 'Backend & Spring', children: [
      { key: 'spring', label: 'Spring Framework', pages: ['ioc-di', 'bean-lifecycle', 'application-context', 'aop', 'interceptors', 'filters'] },
      { key: 'spring-boot', label: 'Spring Boot', pages: ['auto-configuration', 'configuration-properties', 'actuator', 'profiles'] },
      { key: 'spring-web', label: 'Spring Web', pages: ['dispatcher-servlet', 'rest-controllers', 'validation', 'global-exception-handling'] },
      { key: 'spring-security', label: 'Spring Security', pages: ['security-filters', 'authentication', 'authorization', 'preauthorize', 'oauth2-jwt'] },
      { key: 'spring-data', label: 'Spring Data', pages: ['repositories', 'transactions', 'auditing', 'specifications'] },
      { key: 'hibernate-jpa', label: 'Hibernate / JPA', pages: ['entity-mapping', 'entity-lifecycle', 'fetch-types', 'n-plus-one', 'optimistic-locking', 'pessimistic-locking'] },
    ],
  },
  {
    key: 'api-integration', label: 'API & Integration', children: [
      { key: 'api-gateway', label: 'API Gateway', pages: ['gateway-pattern', 'routing', 'authentication-at-gateway', 'gateway-rate-limiting'] },
      { key: 'load-balancing', label: 'Load Balancing', pages: ['load-balancer-basics', 'client-side-load-balancing', 'health-checks'] },
      { key: 'rest', label: 'REST APIs', pages: ['rest-principles', 'http-methods', 'status-codes', 'pagination', 'versioning'] },
      { key: 'resilience', label: 'Resilience', pages: ['timeouts-retries', 'idempotency', 'rate-limiting', 'dos-protection', 'bulkheads'] },
      { key: 'documentation', label: 'API Documentation', pages: ['openapi-swagger', 'postman'] },
    ],
  },
  {
    key: 'databases', label: 'Databases & Storage', children: [
      { key: 'sql', label: 'SQL', pages: ['relational-model', 'normalization', 'indexes', 'sql-data-pages', 'joins', 'transactions', 'deadlocks'] },
      { key: 'nosql', label: 'NoSQL', pages: ['sql-vs-nosql', 'document-databases', 'key-value', 'eventual-consistency'] },
      { key: 'caching', label: 'Caching', pages: ['cache-aside', 'redis', 'hazelcast', 'cache-invalidation'] },
      { key: 'file-storage', label: 'File Storage', pages: ['s3', 'firestore-storage', 'object-storage-patterns'] },
    ],
  },
  {
    key: 'messaging', label: 'Messaging & Streaming', children: [
      { key: 'kafka', label: 'Apache Kafka', pages: ['architecture', 'producers-consumers', 'partitions-offsets', 'consumer-groups', 'delivery-semantics', 'transactions'] },
      { key: 'rabbitmq', label: 'RabbitMQ', pages: ['exchanges-queues', 'acknowledgements', 'routing'] },
      { key: 'patterns', label: 'Messaging Patterns', pages: ['outbox-pattern', 'saga-pattern', 'dead-letter-queues', 'exactly-once-processing'] },
    ],
  },
  {
    key: 'distributed-systems', label: 'Distributed Systems', children: [
      { key: 'service-discovery', label: 'Service Discovery', pages: ['eureka-server', 'eureka-client', 'service-registry'] },
      { key: 'configuration', label: 'Configuration', pages: ['config-server', 'vault', 'secrets-management'] },
      { key: 'resilience', label: 'Resilience Patterns', pages: ['circuit-breaker', 'retry', 'timeout', 'fallback'] },
      { key: 'observability', label: 'Observability', pages: ['logs', 'distributed-tracing', 'sleuth', 'metrics', 'health-checks'] },
      { key: 'scaling', label: 'Scaling', pages: ['horizontal-scaling', 'vertical-scaling', 'autoscaling', 'stateless-services'] },
    ],
  },
  {
    key: 'security', label: 'Security', children: [
      { key: 'application-security', label: 'Application Security', pages: ['owasp-top-10', 'input-validation', 'csrf', 'cors', 'secure-headers'] },
      { key: 'identity', label: 'Identity & Access', pages: ['oauth2', 'openid-connect', 'jwt', 'rbac', 'secrets'] },
      { key: 'api-security', label: 'API Security', pages: ['api-authentication', 'api-authorization', 'token-validation', 'dos-mitigation'] },
      { key: 'dependency-security', label: 'Dependency Security', pages: ['dependency-scanning', 'vulnerability-management'] },
    ],
  },
  {
    key: 'testing-quality', label: 'Testing & Code Quality', children: [
      { key: 'unit-testing', label: 'Unit Testing', pages: ['junit', 'mockito', 'test-doubles', 'test-coverage'] },
      { key: 'integration-testing', label: 'Integration Testing', pages: ['spring-boot-tests', 'testcontainers', 'contract-testing'] },
      { key: 'api-testing', label: 'API Testing', pages: ['postman-testing', 'swagger-testing'] },
      { key: 'quality', label: 'Code Quality', pages: ['sonarqube', 'linting', 'static-analysis', 'quality-gates'] },
      { key: 'performance', label: 'Performance Testing', pages: ['load-testing', 'stress-testing', 'profiling'] },
    ],
  },
  {
    key: 'build-devops', label: 'Build, DevOps & Cloud', children: [
      { key: 'build-tools', label: 'Build Tools', pages: ['maven', 'gradle', 'dependency-management'] },
      { key: 'database-migrations', label: 'Database Migrations', pages: ['flyway', 'liquibase', 'migration-strategy'] },
      { key: 'containers', label: 'Containers', pages: ['docker', 'docker-compose', 'container-images'] },
      { key: 'orchestration', label: 'Kubernetes', pages: ['pods', 'deployments', 'services', 'configmaps-secrets', 'ingress', 'autoscaling'] },
      { key: 'ci-cd', label: 'CI/CD', pages: ['pipeline-basics', 'github-actions', 'deployment-strategies'] },
      { key: 'cloud', label: 'Cloud', pages: ['aws-basics', 'compute', 'managed-databases', 'object-storage'] },
    ],
  },
  {
    key: 'architecture', label: 'Architecture & Design', children: [
      { key: 'software-architecture', label: 'Software Architecture', pages: ['layered-architecture', 'hexagonal-architecture', 'clean-architecture', 'modular-monolith'] },
      { key: 'microservices', label: 'Microservices', pages: ['microservice-boundaries', 'api-composition', 'data-ownership', 'distributed-transactions', 'service-versioning'] },
      { key: 'design-patterns', label: 'Design Patterns', pages: ['creational-patterns', 'structural-patterns', 'behavioral-patterns', 'enterprise-patterns'] },
      { key: 'system-design', label: 'System Design', pages: ['capacity-planning', 'consistency', 'partitioning', 'sharding', 'disaster-recovery'] },
    ],
  },
  {
    key: 'git-collaboration', label: 'Git & Collaboration', children: [
      { key: 'git', label: 'Git', pages: ['branching', 'merge-rebase', 'cherry-pick', 'reset-revert', 'bisect'] },
      { key: 'pull-requests', label: 'Pull Requests', pages: ['pr-review', 'review-checklist', 'commit-strategy'] },
      { key: 'source-control', label: 'Source Control', pages: ['release-branching', 'semantic-versioning'] },
    ],
  },
  {
    key: 'tools', label: 'Developer Tools', children: [
      { key: 'api-tools', label: 'API Tools', pages: ['postman', 'swagger-ui', 'curl'] },
      { key: 'database-tools', label: 'Database Tools', pages: ['database-clients', 'query-analyzers'] },
      { key: 'developer-tools', label: 'Developer Workflow', pages: ['ide-debugging', 'terminal-tools', 'http-debugging'] },
    ],
  },
  {
    key: 'payment-service-provider', label: 'Payment Service Provider', children: [
      { key: 'stripe', label: 'Stripe', pages: [] },
      { key: 'billdesk', label: 'Billdesk', pages: [] },
      { key: 'razor', label: 'Razor', pages: [] },
      { key: 'boxpay', label: 'Boxpay', pages: [] },
    ],
  },
];

const legacyPlatform = ['text', 'nodejs', 'json', 'jwt', 'git', 'email'].map((categoryKey) => {
  const category = CATEGORIES.find((item) => item.key === categoryKey);
  return {
    key: categoryKey,
    label: category?.label || humanize(categoryKey),
    pages: (category?.topics || []).map((item) => ({
      key: item.slug,
      label: item.title,
      contentKey: `${categoryKey}/${item.slug}`,
      keywords: item.tags || [],
    })),
  };
});

tree.push({ key: 'platform', label: 'Platform', children: legacyPlatform });

function normalizeNode(node, parentPath = []) {
  const path = [...parentPath, node.key];
  const children = (node.children || []).map((child) => normalizeNode(child, path));
  const pages = (node.pages || []).map((page) => {
    const item = typeof page === 'string' ? { key: page, label: humanize(page) } : page;
    return {
      ...item,
      key: item.key,
      label: item.label || humanize(item.key),
      path: [...path, item.key].join('/'),
      contentKey: item.contentKey || [...path, item.key].join('/'),
      type: 'page',
    };
  });
  return { ...node, path, children, pages, type: 'node' };
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

export function getNavigationSearchResults(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return NAVIGATION_PAGES.filter((page) => {
    const haystack = [page.label, page.key, page.contentKey, ...page.ancestors.map((item) => `${item.label} ${item.key}`)].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}
