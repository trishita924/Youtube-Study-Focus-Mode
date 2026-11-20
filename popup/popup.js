/**
 * StudyTube Focus — Popup Controller
 * Reads & writes persistent chrome.storage.local state for settings,
 * study lists, timestamp notes, Daily YouTube Study Time, and 60-min Focus Gate.
 */
(function () {
  'use strict';

  let activeVideoInfo = null;
  let sessionTimerInterval = null;

  function getTodayDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

  function formatStudyDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m`;
    }
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function queryCurrentYouTubeVideo() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab || !tab.url || !tab.url.includes('youtube.com/watch')) {
        return null;
      }
      return await chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_VIDEO_INFO' });
    } catch (e) {
      return null;
    }
  }

  async function loadAllState() {
    const data = await chrome.storage.local.get([
      'settings',
      'studyLists',
      'notes',
      'dailyStudyTime',
      'focusSession',
      'usageStats'
    ]);
    const todayKey = getTodayDateKey();
    const rawStudy = data.dailyStudyTime;
    const dailyStudyTime =
      rawStudy && rawStudy.dateKey === todayKey
        ? rawStudy
        : { dateKey: todayKey, totalSeconds: 0 };

    return {
      settings: Object.assign(
        { hideShorts: true, hideRecommendations: true, hideComments: false, focusGateEnabled: true },
        data.settings || {}
      ),
      studyLists: Array.isArray(data.studyLists) && data.studyLists.length > 0
        ? data.studyLists
        : [{ id: 'list-default', name: 'General Study', createdAt: Date.now(), videos: [] }],
      notes: Array.isArray(data.notes) ? data.notes : [],
      dailyStudyTime,
      focusSession: data.focusSession || null,
      usageStats: data.usageStats || { notesCreated: 0, videosAdded: 0, lastActiveAt: Date.now() }
    };
  }

  function renderSessionBox(state) {
    const box = document.getElementById('session-status-box');
    const sess = state.focusSession;
    const isActive = Boolean(
      state.settings.focusGateEnabled &&
      sess &&
      sess.reason &&
      Number(sess.expiresAt) > Date.now()
    );

    if (!isActive) {
      box.classList.add('hidden');
      return;
    }

    const remSec = Math.max(0, Math.ceil((sess.expiresAt - Date.now()) / 1000));
    document.getElementById('popup-session-remaining').textContent = formatTimestamp(remSec);
    document.getElementById('popup-session-reason').textContent = `Goal: "${sess.reason}"`;
    box.classList.remove('hidden');
  }

  async function renderAll() {
    const state = await loadAllState();

    // Header & stats
    const studyStr = formatStudyDuration(state.dailyStudyTime.totalSeconds);
    document.getElementById('header-study-time').textContent = `⏱ ${studyStr}`;
    document.getElementById('stat-study-time').textContent = studyStr;
    document.getElementById('header-stats').textContent = `${state.notes.length} note${state.notes.length === 1 ? '' : 's'}`;
    document.getElementById('stat-notes-count').textContent = String(state.notes.length);
    document.getElementById('stat-lists-count').textContent = String(state.studyLists.length);

    // Focus toggles
    document.getElementById('toggle-focus-gate').checked = Boolean(state.settings.focusGateEnabled);
    document.getElementById('toggle-shorts').checked = Boolean(state.settings.hideShorts);
    document.getElementById('toggle-recs').checked = Boolean(state.settings.hideRecommendations);
    document.getElementById('toggle-comments').checked = Boolean(state.settings.hideComments);

    renderSessionBox(state);

    // Populate list dropdowns
    const noteSelect = document.getElementById('note-list-select');
    const videoSelect = document.getElementById('save-video-list-select');
    [noteSelect, videoSelect].forEach((sel) => {
      const prev = sel.value;
      sel.innerHTML = '';
      state.studyLists.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.name;
        sel.appendChild(opt);
      });
      if (state.studyLists.some((l) => l.id === prev)) sel.value = prev;
    });

    renderNotes(state.notes);
    renderStudyLists(state.studyLists);
  }

  function renderNotes(notes) {
    const q = document.getElementById('notes-search').value.trim().toLowerCase();
    const listEl = document.getElementById('notes-list');
    const filtered = notes.filter((n) => {
      if (!q) return true;
      return (
        n.text.toLowerCase().includes(q) ||
        (n.videoTitle && n.videoTitle.toLowerCase().includes(q))
      );
    });

    listEl.innerHTML = '';
    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="hint-banner" style="text-align:center;">No saved timestamp notes yet.</div>';
      return;
    }

    filtered.forEach((note) => {
      const div = document.createElement('div');
      div.className = 'note-item';
      div.innerHTML = `
        <div class="note-item-head">
          <span class="note-video-title">${escapeHTML(note.videoTitle || note.videoId)}</span>
          <span class="ts-badge">${escapeHTML(note.timestampLabel || formatTimestamp(note.timestamp))}</span>
          <button type="button" class="del-btn" data-id="${note.id}" title="Delete note">&times;</button>
        </div>
        <div class="note-text">${escapeHTML(note.text)}</div>
      `;

      div.addEventListener('click', (e) => {
        if (e.target.closest('.del-btn')) return;
        chrome.runtime.sendMessage({
          type: 'OPEN_VIDEO_AT_TIMESTAMP',
          videoId: note.videoId,
          timestamp: note.timestamp
        });
      });

      div.querySelector('.del-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const state = await loadAllState();
        const updated = state.notes.filter((n) => n.id !== note.id);
        await chrome.storage.local.set({ notes: updated });
        renderAll();
      });

      listEl.appendChild(div);
    });
  }

  function renderStudyLists(lists) {
    const container = document.getElementById('study-lists-container');
    container.innerHTML = '';

    lists.forEach((list) => {
      const card = document.createElement('div');
      card.className = 'study-list-card';
      const videos = Array.isArray(list.videos) ? list.videos : [];
      card.innerHTML = `
        <div class="sl-head">
          <span class="sl-title">${escapeHTML(list.name)} (${videos.length})</span>
          ${list.id !== 'list-default' ? `<button type="button" class="del-btn" data-list-id="${list.id}" title="Delete list">&times;</button>` : ''}
        </div>
        <div class="sl-videos"></div>
      `;

      const videosEl = card.querySelector('.sl-videos');
      if (videos.length === 0) {
        videosEl.innerHTML = '<div style="font-size:11.5px;color:#94A3B8;">No videos saved in this list yet.</div>';
      } else {
        videos.forEach((v) => {
          const row = document.createElement('div');
          row.className = 'sl-video-link';
          row.innerHTML = `
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">▶ ${escapeHTML(v.title || v.videoId)}</span>
            <button type="button" class="del-btn" title="Remove">&times;</button>
          `;
          row.addEventListener('click', (e) => {
            if (e.target.closest('.del-btn')) return;
            chrome.runtime.sendMessage({
              type: 'OPEN_VIDEO_AT_TIMESTAMP',
              videoId: v.videoId,
              timestamp: 0
            });
          });
          row.querySelector('.del-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const state = await loadAllState();
            const target = state.studyLists.find((l) => l.id === list.id);
            if (target) {
              target.videos = (target.videos || []).filter((item) => item.videoId !== v.videoId);
              await chrome.storage.local.set({ studyLists: state.studyLists });
              renderAll();
            }
          });
          videosEl.appendChild(row);
        });
      }

      const delListBtn = card.querySelector('.sl-head .del-btn');
      if (delListBtn) {
        delListBtn.addEventListener('click', async () => {
          const state = await loadAllState();
          const updated = state.studyLists.filter((l) => l.id !== list.id);
          await chrome.storage.local.set({ studyLists: updated });
          renderAll();
        });
      }

      container.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });

    activeVideoInfo = await queryCurrentYouTubeVideo();
    if (activeVideoInfo && activeVideoInfo.isWatchPage) {
      document.getElementById('current-video-box').classList.remove('hidden');
      document.getElementById('no-video-hint').classList.add('hidden');
      document.getElementById('cv-title').textContent = activeVideoInfo.title || activeVideoInfo.videoId;
      document.getElementById('cv-timestamp').textContent = activeVideoInfo.timestampLabel;

      document.getElementById('add-video-to-list-box').classList.remove('hidden');
      document.getElementById('list-cv-title').textContent = activeVideoInfo.title || activeVideoInfo.videoId;
    }

    document.getElementById('note-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeVideoInfo || !activeVideoInfo.isWatchPage) return;

      const latest = await queryCurrentYouTubeVideo();
      if (latest && latest.isWatchPage) activeVideoInfo = latest;

      const text = document.getElementById('note-input').value.trim();
      if (!text) return;

      const listId = document.getElementById('note-list-select').value || 'list-default';
      const note = {
        id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        videoId: activeVideoInfo.videoId,
        videoTitle: activeVideoInfo.title,
        timestamp: activeVideoInfo.currentTime,
        timestampLabel: activeVideoInfo.timestampLabel,
        text,
        listId,
        createdAt: Date.now()
      };

      const state = await loadAllState();
      state.notes.unshift(note);
      state.usageStats.notesCreated = (state.usageStats.notesCreated || 0) + 1;
      state.usageStats.lastActiveAt = Date.now();
      await chrome.storage.local.set({ notes: state.notes, usageStats: state.usageStats });

      document.getElementById('note-input').value = '';
      renderAll();
    });

    document.getElementById('notes-search').addEventListener('input', async () => {
      const state = await loadAllState();
      renderNotes(state.notes);
    });

    document.getElementById('create-list-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('new-list-name');
      const name = input.value.trim();
      if (!name) return;

      const state = await loadAllState();
      state.studyLists.push({
        id: 'list-' + Date.now(),
        name,
        createdAt: Date.now(),
        videos: []
      });
      await chrome.storage.local.set({ studyLists: state.studyLists });
      input.value = '';
      renderAll();
    });

    document.getElementById('btn-save-current-video').addEventListener('click', async () => {
      if (!activeVideoInfo || !activeVideoInfo.isWatchPage) return;
      const listId = document.getElementById('save-video-list-select').value;
      const state = await loadAllState();
      const target = state.studyLists.find((l) => l.id === listId);
      if (!target) return;

      target.videos = target.videos || [];
      if (!target.videos.some((v) => v.videoId === activeVideoInfo.videoId)) {
        target.videos.unshift({
          videoId: activeVideoInfo.videoId,
          title: activeVideoInfo.title,
          addedAt: Date.now()
        });
        await chrome.storage.local.set({ studyLists: state.studyLists });
      }
      renderAll();
    });

    const saveSettings = async () => {
      const settings = {
        focusGateEnabled: document.getElementById('toggle-focus-gate').checked,
        hideShorts: document.getElementById('toggle-shorts').checked,
        hideRecommendations: document.getElementById('toggle-recs').checked,
        hideComments: document.getElementById('toggle-comments').checked
      };
      await chrome.storage.local.set({ settings });
      const state = await loadAllState();
      renderSessionBox(state);
    };

    document.getElementById('toggle-focus-gate').addEventListener('change', saveSettings);
    document.getElementById('toggle-shorts').addEventListener('change', saveSettings);
    document.getElementById('toggle-recs').addEventListener('change', saveSettings);
    document.getElementById('toggle-comments').addEventListener('change', saveSettings);

    document.getElementById('btn-end-session').addEventListener('click', async () => {
      await chrome.storage.local.set({ focusSession: null });
      renderAll();
    });

    await renderAll();

    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(async () => {
      const state = await loadAllState();
      renderSessionBox(state);
      const studyStr = formatStudyDuration(state.dailyStudyTime.totalSeconds);
      document.getElementById('header-study-time').textContent = `⏱ ${studyStr}`;
      document.getElementById('stat-study-time').textContent = studyStr;
    }, 1000);
  });
})();
