/**
 * src/data/topics/navigation.js
 * ------------------------------------------------------------------
 * Metadata-driven documentation navigation.
 *
 * Shape:
 *   Section -> Topic -> Subtopic -> Page
 *
 * Existing topic content remains owned by the category files. This
 * file describes how that content is grouped and displayed.
 */

import { CATEGORIES } from './index.js';

function pagesFromCategory(categoryKey) {
  const category = CATEGORIES.find((item) => item.key === categoryKey);
  return (category?.topics ?? []).map((topic) => ({
    key: topic.slug,
    title: topic.title,
    summary: topic.summary,
    keywords: topic.tags ?? [],
    categoryKey,
    topicSlug: topic.slug,
    contentKey: `${categoryKey}/${topic.slug}`,
  }));
}

const javaPages = pagesFromCategory('java');

function page(key, title, keywords = [], contentKey = null, summary = '') {
  return { key, title, summary, keywords, contentKey };
}

function subtopic(key, title, pages = [], keywords = []) {
  return { key, title, keywords, pages };
}

function topic(key, title, subtopics = [], pages = [], keywords = []) {
  return { key, title, keywords, subtopics, pages };
}

function legacyTopic(categoryKey, topicKey, title, keywords = []) {
  return topic(topicKey, title, [], pagesFromCategory(categoryKey), keywords);
}

export const DOCUMENTATION_NAVIGATION = [
  {
    key: 'languages',
    title: 'Languages',
    topics: [
      topic(
        'java',
        'Java',
        [
          subtopic('object-oriented-programming', 'Object-Oriented Programming (OOP)', [
            page('class', 'Class', ['java', 'oop', 'class']),
            page('object', 'Object', ['java', 'oop', 'object']),
            page('encapsulation', 'Encapsulation', ['java', 'oop', 'encapsulation']),
            page('abstraction', 'Abstraction', ['java', 'oop', 'abstraction']),
            page('polymorphism', 'Polymorphism', ['java', 'oop', 'polymorphism']),
            javaPages.find((item) => item.key === 'optional'),
            javaPages.find((item) => item.key === 'records'),
          ].filter(Boolean), ['java', 'oop']),
          subtopic('exception-handling', 'Exception Handling', [], ['java', 'exceptions']),
          subtopic('collections', 'Collections', [
            javaPages.find((item) => item.key === 'streams'),
          ].filter(Boolean), ['java', 'collections']),
          subtopic('multithreading', 'Multithreading', [], ['java', 'concurrency', 'threads']),
        ],
        [],
        ['java']
      ),
      topic('javascript', 'JavaScript', [], pagesFromCategory('javascript'), ['javascript', 'js']),
    ],
  },
  {
    key: 'payment-service-provider',
    title: 'Payment Service Provider',
    topics: [
      topic('stripe', 'Stripe', [], [], ['stripe', 'payments', 'payment-service-provider']),
      topic('billdesk', 'Billdesk', [], [], ['billdesk', 'payments', 'payment-service-provider']),
      topic('razor', 'Razor', [], [], ['razor', 'payments', 'payment-service-provider']),
      topic('boxpay', 'Boxpay', [], [], ['boxpay', 'payments', 'payment-service-provider']),
    ],
  },
  {
    key: 'platform',
    title: 'Platform',
    topics: [
      legacyTopic('text', 'text', 'Text', ['text']),
      legacyTopic('nodejs', 'nodejs', 'Node.js', ['nodejs', 'node']),
      legacyTopic('json', 'json', 'JSON', ['json']),
      legacyTopic('jwt', 'jwt', 'JWT', ['jwt', 'security']),
      legacyTopic('git', 'git', 'Git', ['git', 'version-control']),
      legacyTopic('email', 'email', 'Email', ['email', 'smtp', 'imap', 'pop3']),
    ],
  },
];

export function getDocumentationSection(sectionKey) {
  return DOCUMENTATION_NAVIGATION.find((section) => section.key === sectionKey);
}

export function getDocumentationRoute(sectionKey, topicSlug, subtopicSlug, pageSlug) {
  const section = getDocumentationSection(sectionKey);
  const topic = section?.topics.find((item) => item.key === topicSlug);
  if (!topic) return undefined;

  if (!subtopicSlug) {
    return { type: 'topic', sectionKey: section.key, topic };
  }

  const subtopic = topic.subtopics.find((item) => item.key === subtopicSlug);

  if (!pageSlug) {
    const directPage = topic.pages.find((item) => item.key === subtopicSlug);
    if (directPage) return { type: 'page', sectionKey: section.key, topic, page: directPage };
    if (subtopic) return { type: 'subtopic', sectionKey: section.key, topic, subtopic };
    return undefined;
  }

  const pageItem = subtopic?.pages.find((item) => item.key === pageSlug);
  if (!subtopic || !pageItem) return undefined;

  return { type: 'page', sectionKey: section.key, topic, subtopic, page: pageItem };
}

export function getDocumentationSearchResults(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];

  for (const section of DOCUMENTATION_NAVIGATION) {
    for (const topicItem of section.topics) {
      const topicMatches = `${topicItem.title} ${topicItem.key} ${topicItem.keywords.join(' ')}`
        .toLowerCase()
        .includes(normalized);

      if (topicMatches) {
        results.push({
          type: 'topic',
          sectionKey: section.key,
          topic: topicItem,
          path: `/content/${section.key}/${topicItem.key}`,
        });
      }

      for (const subtopicItem of topicItem.subtopics) {
        const subtopicMatches = `${subtopicItem.title} ${subtopicItem.key} ${subtopicItem.keywords.join(' ')}`
          .toLowerCase()
          .includes(normalized);

        if (subtopicMatches) {
          results.push({
            type: 'subtopic',
            sectionKey: section.key,
            topic: topicItem,
            subtopic: subtopicItem,
            path: `/content/${section.key}/${topicItem.key}/${subtopicItem.key}`,
          });
        }

        for (const pageItem of subtopicItem.pages) {
          const pageMatches = `${pageItem.title} ${pageItem.key} ${(pageItem.keywords ?? []).join(' ')} ${pageItem.summary ?? ''}`
            .toLowerCase()
            .includes(normalized);

          if (pageMatches) {
            results.push({
              type: 'page',
              sectionKey: section.key,
              topic: topicItem,
              subtopic: subtopicItem,
              page: pageItem,
              path: `/content/${section.key}/${topicItem.key}/${subtopicItem.key}/${pageItem.key}`,
            });
          }
        }
      }

      for (const pageItem of topicItem.pages) {
        const pageMatches = `${pageItem.title} ${pageItem.key} ${(pageItem.keywords ?? []).join(' ')} ${pageItem.summary ?? ''}`
          .toLowerCase()
          .includes(normalized);

        if (pageMatches) {
          results.push({
            type: 'page',
            sectionKey: section.key,
            topic: topicItem,
            page: pageItem,
            path: `/content/${section.key}/${topicItem.key}/${pageItem.key}`,
          });
        }
      }
    }
  }

  return results;
}
