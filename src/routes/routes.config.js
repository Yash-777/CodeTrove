/**
 * src/routes/routes.config.js
 * ------------------------------------------------------------------
 * Centralized URL path builders, organized around the three pillars
 * from the Codetrove structure: LEARN, BUILD, STORE (see Sidebar.jsx
 * for the tab switcher that navigates between them).
 */

export const paths = {
  home: () => '/',

  // LEARN
  category: (categoryKey) => `/content/${categoryKey}`,
  topic: (categoryKey, slug) => `/content/${categoryKey}/${slug}`,
  practice: () => '/learn/practice',
  createPage: () => '/create-page',
  drafts: () => '/drafts',

  // BUILD
  compiler: () => '/build/compiler',
  tools: () => '/build/tools',
  projects: () => '/build/projects',

  // STORE (personal, requires login)
  profile: () => '/store/profile',
  resume: () => '/store/resume',
  certificates: () => '/store/certificates',
  career: () => '/store/career',

  // account / admin
  signUp: () => '/signup',
  signIn: () => '/signin',
  adminUsers: () => '/admin/users',
  preferences: () => '/preferences',
};
