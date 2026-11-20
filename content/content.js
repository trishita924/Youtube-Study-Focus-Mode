/**
 * StudyTube Focus — Content Script
 * Handles YouTube SPA navigation without reload, persistent distraction hiding,
 * in-page quick timestamp notes, exact video timestamp seeking,
 * active-tab Daily Study Time tracking, and the 60-minute "Why Are You Here?" Focus Gate.
 */
(function () {
  'use strict';

  const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes

  let currentSettings = {
    hideShorts: true,
    hideRecommendations: true,
    hideComments: false,
    focusGateEnabled: true
  };
  let currentFocusSession = null;
  let lastUrl = location.href;
  let observerTimer = null;
  let pendingStudySeconds = 0;

  // ==================== HELPERS ====================
  function getTodayDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getVideoIdFromUrl(urlStr) {
    try {
      const u = new URL(urlStr || location.href);
      if (u.pathname === '/watch') {
        return u.searchParams.get('v');
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2] || null;
      }
    } catch (e) {}
    return null;
  }

  function formatTimestamp(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getVideoElement() {
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function getVideoTitle() {
    const el =
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('#title h1 yt-formatted-string') ||
      document.querySelector('meta[name="title"]');
    if (el) {
      return (el.textContent || el.getAttribute('content') || '').trim() || document.title.replace(' - YouTube', '');
    }
    return document.title.replace(' - YouTube', '').trim();
  }

  // ==================== APPLY FOCUS SETTINGS ====================
  function applySettingsClasses() {
    const root = document.documentElement;
    root.classList.toggle('st-hide-shorts', Boolean(currentSettings.hideShorts));
    root.classList.toggle('st-hide-recs', Boolean(currentSettings.hideRecommendations));
    root.classList.toggle('st-hide-comments', Boolean(currentSettings.hideComments));

    if (currentSettings.hideShorts) {
      document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach((el) => {
        const link = el.querySelector('a[href^="/shorts"]');
        if (link || el.getAttribute('aria-label') === 'Shorts') {
          el.style.display = 'none';
        }
      });
    } else {
      document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach((el) => {
        if (el.style.display === 'none') el.style.display = '';
      });
    }
  }

  // ==================== FEATURE 2: "WHY ARE YOU HERE?" FOCUS GATE ====================
  function isSessionActive(session) {
    return Boolean(session && session.reason && Number(session.expiresAt) > Date.now());
  }

  function ensureFocusGateUI() {
    let gate = document.getElementById('st-focus-gate');
    if (!gate && document.body) {
      gate = document.createElement('div');
      gate.id = 'st-focus-gate';
      gate.className = 'st-hidden';
      gate.innerHTML = `
        <div class="st-gate-card" role="dialog" aria-modal="true" aria-labelledby="st-gate-heading">
          <span class="st-gate-badge">StudyTube Focus Gate</span>
          <h2 id="st-gate-heading" class="st-gate-title">Why are you here?</h2>
          <p class="st-gate-subtitle">Enter your study goal to unlock YouTube for 60 minutes. Stay intentional and focused.</p>
          <form id="st-gate-form" class="st-gate-form" novalidate>
            <input type="text" id="st-gate-reason-input" placeholder="e.g., Revising thermodynamics" autocomplete="off" required />
            <div id="st-gate-error" class="st-gate-error st-hidden">Please enter a study reason to continue.</div>
            <button type="submit" id="st-gate-submit-btn">Unlock YouTube for 60 Minutes</button>
          </form>
        </div>
      `;
      document.body.appendChild(gate);

      const form = gate.querySelector('#st-gate-form');
      const input = gate.querySelector('#st-gate-reason-input');
      const errEl = gate.querySelector('#st-gate-error');

      input.addEventListener('keydown', (e) => e.stopPropagation());

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reason = input.value.trim();
        if (!reason) {
          errEl.classList.remove('st-hidden');
          input.focus();
          return;
        }
        errEl.classList.add('st-hidden');

        const newSession = {
          reason,
          startedAt: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION_MS
        };
        currentFocusSession = newSession;
        await chrome.storage.local.set({ focusSession: newSession });
        input.value = '';
        updateFocusGateState();
      });
    }

    let pill = document.getElementById('st-session-pill');
    if (!pill && document.body) {
      pill = document.createElement('div');
      pill.id = 'st-session-pill';
      pill.className = 'st-hidden';
      pill.innerHTML = `
        <span class="st-session-reason"></span>
        <span>•</span>
        <span class="st-session-timer">60:00</span>
      `;
      document.body.appendChild(pill);
    }
  }

  function updateFocusGateState() {
    ensureFocusGateUI();
    const gate = document.getElementById('st-focus-gate');
    const pill = document.getElementById('st-session-pill');
    if (!gate || !pill) return;

    if (!currentSettings.focusGateEnabled) {
      gate.classList.add('st-hidden');
      pill.classList.add('st-hidden');
      return;
    }

    if (isSessionActive(currentFocusSession)) {
      gate.classList.add('st-hidden');
      const remainingSec = Math.max(0, Math.ceil((currentFocusSession.expiresAt - Date.now()) / 1000));
      pill.querySelector('.st-session-reason').textContent = currentFocusSession.reason;
      pill.querySelector('.st-session-timer').textContent = formatTimestamp(remainingSec) + ' left';
      pill.classList.remove('st-hidden');
    } else {
      currentFocusSession = null;
      gate.classList.remove('st-hidden');
      pill.classList.add('st-hidden');
      const video = getVideoElement();
      if (video && !video.paused) {
        video.pause();
      }
    }
  }

  // ==================== FEATURE 1: DAILY YOUTUBE STUDY TIME ====================
  function isActivelyViewingYouTube() {
    return document.visibilityState === 'visible' && document.hasFocus();
  }

  async function flushStudyTime() {
    if (pendingStudySeconds <= 0) return;
    const toAdd = pendingStudySeconds;
    pendingStudySeconds = 0;

    try {
      const todayKey = getTodayDateKey();
      const data = await chrome.storage.local.get(['dailyStudyTime']);
      let record = data.dailyStudyTime;
      if (!record || record.dateKey !== todayKey) {
        record = { dateKey: todayKey, totalSeconds: 0 };
      }
      record.totalSeconds = (Number(record.totalSeconds) || 0) + toAdd;
      await chrome.storage.local.set({ dailyStudyTime: record });
    } catch (e) {}
  }

  setInterval(() => {
    if (isActivelyViewingYouTube()) {
      pendingStudySeconds += 1;
      if (pendingStudySeconds >= 5) {
        flushStudyTime();
      }
    }
    updateFocusGateState();
  }, 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      flushStudyTime();
    }
  });
  window.addEventListener('blur', flushStudyTime);
  window.addEventListener('pagehide', flushStudyTime);

  // ==================== EXACT TIMESTAMP SEEKING ====================
  function seekVideoTo(seconds) {
    const target = Math.max(0, Math.floor(Number(seconds) || 0));
    const trySeek = (attemptsLeft) => {
      const video = getVideoElement();
      if (video && video.readyState >= 1) {
        video.currentTime = target;
        if (!currentSettings.focusGateEnabled || isSessionActive(currentFocusSession)) {
          video.play().catch(() => {});
        }
        const player = document.getElementById('movie_player') || video;
        if (player && player.scrollIntoView) {
          player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (attemptsLeft > 0) {
        setTimeout(() => trySeek(attemptsLeft - 1), 250);
      }
    };
    trySeek(20);
  }

  async function checkPendingSeek() {
    try {
      const data = await chrome.storage.local.get(['pendingSeek']);
      const pending = data.pendingSeek;
      if (!pending) return;

      const isFresh = Date.now() - pending.createdAt < 30000;
      const currentVid = getVideoIdFromUrl(location.href);
      if (isFresh && currentVid && currentVid === pending.videoId) {
        await chrome.storage.local.remove('pendingSeek');
        seekVideoTo(pending.timestamp);
      } else if (!isFresh) {
        await chrome.storage.local.remove('pendingSeek');
      }
    } catch (e) {}
  }

  // ==================== IN-PAGE QUICK TIMESTAMP BAR ====================
  function ensureQuickBar() {
    let bar = document.getElementById('st-quick-bar');
    const isWatchPage = location.pathname === '/watch' && Boolean(getVideoIdFromUrl(location.href));

    if (!bar && document.body) {
      bar = document.createElement('div');
      bar.id = 'st-quick-bar';
      bar.innerHTML = `
        <input type="text" id="st-quick-note-input" placeholder="Quick study note..." />
        <button type="button" id="st-quick-note-btn">+ Note</button>
        <span id="st-quick-toast" class="st-hidden">Saved!</span>
      `;
      document.body.appendChild(bar);

      const input = bar.querySelector('#st-quick-note-input');
      const btn = bar.querySelector('#st-quick-note-btn');
      const toast = bar.querySelector('#st-quick-toast');

      const saveQuickNote = async () => {
        const videoId = getVideoIdFromUrl(location.href);
        const video = getVideoElement();
        if (!videoId || !video) return;

        const text = input.value.trim();
        if (!text) {
          input.focus();
          return;
        }

        const ts = Math.floor(video.currentTime || 0);
        const note = {
          id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          videoId,
          videoTitle: getVideoTitle(),
          timestamp: ts,
          timestampLabel: formatTimestamp(ts),
          text,
          listId: 'list-default',
          createdAt: Date.now()
        };

        const stored = await chrome.storage.local.get(['notes', 'usageStats']);
        const notes = Array.isArray(stored.notes) ? stored.notes : [];
        notes.unshift(note);
        const stats = stored.usageStats || { notesCreated: 0, videosAdded: 0, lastActiveAt: Date.now() };
        stats.notesCreated = (stats.notesCreated || 0) + 1;
        stats.lastActiveAt = Date.now();

        await chrome.storage.local.set({ notes, usageStats: stats });
        input.value = '';
        toast.textContent = `Saved @ ${note.timestampLabel}`;
        toast.classList.remove('st-hidden');
        setTimeout(() => toast.classList.add('st-hidden'), 2200);
      };

      btn.addEventListener('click', saveQuickNote);
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') saveQuickNote();
      });
    }

    if (bar) {
      bar.classList.toggle('st-hidden', !isWatchPage);
    }
  }

  // ==================== SPA NAVIGATION & STORAGE SYNC ====================
  async function loadInitialState() {
    try {
      const data = await chrome.storage.local.get(['settings', 'focusSession']);
      if (data.settings) {
        currentSettings = Object.assign({}, currentSettings, data.settings);
      }
      currentFocusSession = data.focusSession || null;
      applySettingsClasses();
      updateFocusGateState();
    } catch (e) {}
  }

  function onYouTubeNavigate() {
    lastUrl = location.href;
    applySettingsClasses();
    ensureQuickBar();
    updateFocusGateState();
    checkPendingSeek();
  }

  window.addEventListener('yt-navigate-finish', onYouTubeNavigate);
  window.addEventListener('yt-page-data-updated', onYouTubeNavigate);
  window.addEventListener('popstate', onYouTubeNavigate);

  setInterval(() => {
    if (location.href !== lastUrl) {
      onYouTubeNavigate();
    }
  }, 500);

  const observer = new MutationObserver(() => {
    if (observerTimer) return;
    observerTimer = setTimeout(() => {
      observerTimer = null;
      applySettingsClasses();
    }, 150);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.settings) {
      currentSettings = Object.assign({}, currentSettings, changes.settings.newValue);
      applySettingsClasses();
      updateFocusGateState();
    }
    if (changes.focusSession) {
      currentFocusSession = changes.focusSession.newValue || null;
      updateFocusGateState();
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return false;

    if (msg.type === 'GET_CURRENT_VIDEO_INFO') {
      const videoId = getVideoIdFromUrl(location.href);
      const video = getVideoElement();
      sendResponse({
        isWatchPage: Boolean(videoId),
        videoId,
        title: videoId ? getVideoTitle() : '',
        currentTime: video ? Math.floor(video.currentTime || 0) : 0,
        timestampLabel: video ? formatTimestamp(video.currentTime || 0) : '00:00',
        url: location.href
      });
      return false;
    }

    if (msg.type === 'JUMP_TO_VIDEO_TIMESTAMP') {
      const currentVid = getVideoIdFromUrl(location.href);
      if (currentVid && currentVid === msg.videoId) {
        seekVideoTo(msg.timestamp);
        sendResponse({ handled: true, mode: 'same-video-seek' });
      } else {
        location.href = `https://www.youtube.com/watch?v=${encodeURIComponent(msg.videoId)}&t=${Math.floor(msg.timestamp)}s`;
        sendResponse({ handled: true, mode: 'navigate' });
      }
      return false;
    }

    return false;
  });

  loadInitialState().then(() => {
    onYouTubeNavigate();
  });
})();
