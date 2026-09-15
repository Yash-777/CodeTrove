/**
 * src/utils/recentTopics.js
 * ------------------------------------------------------------------
 * Tracks the last few topics the person opened, stored in the
 * browser's localStorage (this is a real app running in a real
 * browser on the user's own machine, not a sandboxed preview - so
 * localStorage is the right, normal tool here, unlike in a throwaway
 * demo widget).
 *
 * This powers the Sidebar's "Recent" section, mirroring how
 * claude.ai shows your recent chats below the Projects list.
 */

const STORAGE_KEY = 'codetrove:recent-topics';
const MAX_RECENT = 6;

/** Returns the recent list as an array of {categoryKey, slug, title}. */
export function getRecentTopics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; // localStorage can be unavailable (private browsing, etc.) - fail quietly
  }
}

/** Adds/moves a topic to the front of the recent list, capped at MAX_RECENT. */
export function addRecentTopic(entry) {
  try {
    const current = getRecentTopics().filter(
      (item) => !(item.categoryKey === entry.categoryKey && item.slug === entry.slug)
    );
    const next = [entry, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore - recent history is a nice-to-have, not critical
  }
}
