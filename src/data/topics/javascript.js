const javascriptTopics = [
  {
    slug: 'promises',
    title: 'Promises & async/await',
    summary: 'Handling asynchronous operations without callback pyramids.',
    tags: ['javascript', 'async'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
  {
    slug: 'destructuring',
    title: 'Destructuring',
    summary: 'Unpack values from arrays/objects into distinct variables.',
    tags: ['javascript', 'syntax'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
  {
    slug: 'event-loop',
    title: 'The Event Loop',
    summary: 'How JavaScript handles async work on a single thread.',
    tags: ['javascript', 'runtime'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
  {
    slug: 'array-methods',
    title: 'Array methods',
    summary: 'A reference-friendly guide to the methods used to transform and inspect arrays.',
    tags: ['javascript', 'arrays'],
    gifUrl: null,
    relatedTool: null,
    body: '',
    subtopics: [
      {
        slug: 'map-filter-reduce',
        title: 'map, filter, and reduce',
        summary: 'Transform, select, and aggregate array values.',
        tags: ['javascript', 'arrays', 'functional'],
        contentRoot: 'sub-topics',
      },
    ],
  },
];

export default javascriptTopics;
