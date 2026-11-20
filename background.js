/**
 * StudyTube Focus — Background Service Worker (Manifest V3)
 * Initializes default persistent storage on install and coordinates
 * cross-tab video navigation + timestamp jumping.
 */
'use strict';

function getTodayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_STATE = {
  settings: {
    hideShorts: true,
    hideRecommendations: true,
    hideComments: false,
    focusGateEnabled: true
  },
  studyLists: [
    {
      id: 'list-default',
      name: 'General Study',
      createdAt: Date.now(),
      videos: []
    }
  ],
  notes: [],
  dailyStudyTime: {
    dateKey: getTodayDateKey(),
    totalSeconds: 0
  },
  focusSession: null,
  usageStats: {
    notesCreated: 0,
    videosAdded: 0,
    lastActiveAt: Date.now()
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get([
    'settings',
    'studyLists',
    'notes',
    'dailyStudyTime',
    'focusSession',
    'usageStats'
  ]);
  const toSet = {};
  if (!existing.settings) {
    toSet.settings = DEFAULT_STATE.settings;
  } else if (typeof existing.settings.focusGateEnabled !== 'boolean') {
    toSet.settings = Object.assign({}, DEFAULT_STATE.settings, existing.settings);
  }
  if (!existing.studyLists) toSet.studyLists = DEFAULT_STATE.studyLists;
  if (!existing.notes) toSet.notes = DEFAULT_STATE.notes;
  if (!existing.dailyStudyTime) toSet.dailyStudyTime = DEFAULT_STATE.dailyStudyTime;
  if (existing.focusSession === undefined) toSet.focusSession = DEFAULT_STATE.focusSession;
  if (!existing.usageStats) toSet.usageStats = DEFAULT_STATE.usageStats;

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  if (message.type === 'OPEN_VIDEO_AT_TIMESTAMP') {
    handleOpenVideoAtTimestamp(message.videoId, message.timestamp)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep channel open for async response
  }

  return false;
});

async function handleOpenVideoAtTimestamp(videoId, timestampSec) {
  const sec = Math.max(0, Math.floor(Number(timestampSec) || 0));
  const targetUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&t=${sec}s`;

  // Store pending seek so content.js can enforce exact seek even after SPA navigation or reload
  await chrome.storage.local.set({
    pendingSeek: {
      videoId,
      timestamp: sec,
      createdAt: Date.now()
    }
  });

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (activeTab && activeTab.url && activeTab.url.includes('youtube.com')) {
    try {
      const resp = await chrome.tabs.sendMessage(activeTab.id, {
        type: 'JUMP_TO_VIDEO_TIMESTAMP',
        videoId,
        timestamp: sec
      });
      if (resp && resp.handled) {
        return { ok: true, mode: 'in-page' };
      }
    } catch (e) {
      // Content script not ready; fall back to tab URL update
    }
    await chrome.tabs.update(activeTab.id, { url: targetUrl });
    return { ok: true, mode: 'tab-update' };
  }

  await chrome.tabs.create({ url: targetUrl });
  return { ok: true, mode: 'new-tab' };
}
