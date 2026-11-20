# StudyTube Focus — YouTube Study & Timestamp Notes (Chrome Extension)

Stay focused while studying on YouTube! **StudyTube Focus** helps you study intentionally with a **"Why Are You Here?" Focus Gate**, tracks your **Daily YouTube Study Time**, hides distracting Shorts, recommendations, and comments across YouTube navigation without reloading, organizes videos into **Study Lists**, and saves **clickable Timestamp Notes**.

---

## Features

- **"Why Are You Here?" Focus Gate (60-Minute Sessions)**:
  - Prompts you to enter your study goal (e.g., *"Revising thermodynamics"*) before unlocking YouTube for **60 minutes**.
  - Displays a live countdown timer with your study goal and automatically locks again when the 60 minutes expire.
  - Can be turned **ON/OFF** anytime in the extension popup under **Focus Mode**.
- **Daily YouTube Study Time Tracker**:
  - Measures actual active time spent on YouTube (only when the YouTube tab is visible and focused—never counts background tabs or inactive windows).
  - Automatically resets at midnight when the calendar day changes.
- **Distraction-Free Focus Mode (No Reload Needed)**:
  - Toggle hiding **YouTube Shorts**, **Recommendations / Up Next**, and **Comments**—stays active as you click between videos.
- **Clickable Timestamp Notes & Study Lists**:
  - Save notes linked to exact video timestamps (`MM:SS`) via the floating in-page bar or extension popup.
  - Clicking any saved note opens that video and jumps directly to the saved second.

---

## How to Install (For Friends — No Coding Required!)

Follow these 6 simple steps in Google Chrome (or Microsoft Edge / Brave):

### Step 1: Download & Extract the ZIP File
1. Download **`YouTube-Study-Focus.zip`**.
2. **Right-click** the ZIP file and choose **Extract All...** (Windows) or **double-click** it (Mac).
3. Make sure you see a folder named **`YouTube-Study-Focus`** containing `manifest.json`, `background.js`, `content/`, `popup/`, and `icons/`.

### Step 2: Open Chrome Extensions Page
1. Open Google Chrome.
2. Click the address bar at the top, type **`chrome://extensions`**, and press **Enter**.

### Step 3: Turn On Developer Mode
1. Look at the **top-right corner** of the Extensions page.
2. Click the **Developer mode** toggle switch so it turns **ON** (blue).

### Step 4: Load the Extension
1. Click **Load unpacked** at the top-left.
2. Browse to the folder you extracted in Step 1 and select the **`YouTube-Study-Focus`** folder (the folder that has `manifest.json` inside it).
3. Click **Select Folder** (or **Open**).
4. **StudyTube Focus** will now appear in your extensions list!

### Step 5: Pin It to Your Toolbar (Recommended)
1. Click the **Puzzle Piece icon** (🧩) in the top-right corner of Chrome.
2. Find **StudyTube Focus** and click the **Pin icon** (📌) next to it so it stays visible.

### Step 6: Start Using It on YouTube
1. Open [YouTube](https://www.youtube.com).
2. Enter your study goal in the **"Why Are You Here?"** Focus Gate to unlock YouTube for 60 minutes.
3. Click the **StudyTube Focus** icon in your toolbar to:
   - View **Today's YouTube Study Time** and **Remaining Session Time**.
   - Toggle **Focus Gate**, **Hide Shorts**, **Hide Recommendations**, and **Hide Comments**.
   - Create **Study Lists** and save/jump to **Timestamp Notes**.

---

## Privacy & Data Storage

- All settings, study lists, timestamp notes, focus sessions, and daily study time are stored locally on your computer using `chrome.storage.local`.
- Your data survives closing and restarting Chrome.
- No account, login, or external server is used.
