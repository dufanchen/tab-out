/**
 * background.js — Service Worker for Badge Updates
 *
 * Chrome's "always-on" background script for Tab Out.
 * Its only job: keep the toolbar badge showing the current open tab count.
 *
 * Since we no longer have a server, we query chrome.tabs directly.
 * The badge counts real web tabs (skipping chrome:// and extension pages).
 *
 * Color coding gives a quick at-a-glance health signal:
 *   Green  (#3d7a4a) → 1–10 tabs  (focused, manageable)
 *   Amber  (#b8892e) → 11–20 tabs (getting busy)
 *   Red    (#b35a5a) → 21+ tabs   (time to cull!)
 */

// ─── Badge updater ────────────────────────────────────────────────────────────

/**
 * updateBadge()
 *
 * Counts open real-web tabs and updates the extension's toolbar badge.
 * "Real" tabs = not chrome://, not extension pages, not about:blank.
 */
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});

    // Only count actual web pages — skip browser internals and extension pages
    const count = tabs.filter(t => {
      const url = t.url || '';
      return (
        !url.startsWith('chrome://') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('about:') &&
        !url.startsWith('edge://') &&
        !url.startsWith('brave://')
      );
    }).length;

    // Don't show "0" — an empty badge is cleaner
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    if (count === 0) return;

    // Pick badge color based on workload level
    let color;
    if (count <= 10) {
      color = '#3d7a4a'; // Green — you're in control
    } else if (count <= 20) {
      color = '#b8892e'; // Amber — things are piling up
    } else {
      color = '#b35a5a'; // Red — time to focus and close some tabs
    }

    await chrome.action.setBadgeBackgroundColor({ color });

  } catch {
    // If something goes wrong, clear the badge rather than show stale data
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Last-accessed tracking ─────────────────────────────────────────────────
//
// Chrome's native tab.lastAccessed resets on browser restart, so we keep our
// own durable record of when each tab was last viewed. We store a simple
// { [tabId]: timestamp } map in chrome.storage.local under STORAGE_KEY.
// The dashboard (app.js) reads this map to surface "stale" (long-unviewed) tabs.

const LAST_ACCESSED_KEY = 'tabLastAccessed';

/**
 * recordTabAccess(tabId)
 *
 * Stamps the given tab with the current time as its "last viewed" moment.
 */
async function recordTabAccess(tabId) {
  if (typeof tabId !== 'number') return;
  try {
    const stored = await chrome.storage.local.get(LAST_ACCESSED_KEY);
    const accessMap = stored[LAST_ACCESSED_KEY] || {};
    accessMap[tabId] = Date.now();
    await chrome.storage.local.set({ [LAST_ACCESSED_KEY]: accessMap });
  } catch {
    // Storage failures are non-fatal — we simply lose this one timestamp
  }
}

/**
 * forgetTab(tabId)
 *
 * Removes a closed tab's timestamp so the map doesn't grow forever.
 */
async function forgetTab(tabId) {
  try {
    const stored = await chrome.storage.local.get(LAST_ACCESSED_KEY);
    const accessMap = stored[LAST_ACCESSED_KEY] || {};
    if (accessMap[tabId] !== undefined) {
      delete accessMap[tabId];
      await chrome.storage.local.set({ [LAST_ACCESSED_KEY]: accessMap });
    }
  } catch {
    // Non-fatal
  }
}

/**
 * seedTimestampsForExistingTabs()
 *
 * On install/startup, give every already-open tab a baseline timestamp so the
 * dashboard has data to work with immediately instead of waiting for the user
 * to manually switch to each tab.
 */
async function seedTimestampsForExistingTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    const stored = await chrome.storage.local.get(LAST_ACCESSED_KEY);
    const accessMap = stored[LAST_ACCESSED_KEY] || {};
    const now = Date.now();
    for (const tab of tabs) {
      // The active tab in each window counts as "just viewed"; others get a
      // baseline of now too, so the stale clock starts ticking from install.
      if (accessMap[tab.id] === undefined) accessMap[tab.id] = now;
    }
    await chrome.storage.local.set({ [LAST_ACCESSED_KEY]: accessMap });
  } catch {
    // Non-fatal
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

// Update badge when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
  seedTimestampsForExistingTabs();
});

// Update badge when Chrome starts up
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
  seedTimestampsForExistingTabs();
});

// Update badge whenever a tab is opened
chrome.tabs.onCreated.addListener((tab) => {
  updateBadge();
  recordTabAccess(tab.id);
});

// Update badge whenever a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  updateBadge();
  forgetTab(tabId);
});

// Update badge when a tab's URL changes (e.g. navigating to/from chrome://)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  updateBadge();
  // Navigating to a new page within a tab counts as viewing it
  if (changeInfo.url) recordTabAccess(tabId);
});

// Stamp the tab the user just switched to — this is the core "last viewed" signal
chrome.tabs.onActivated.addListener((activeInfo) => {
  recordTabAccess(activeInfo.tabId);
});

// ─── Initial run ─────────────────────────────────────────────────────────────

// Run once immediately when the service worker first loads
updateBadge();
seedTimestampsForExistingTabs();
