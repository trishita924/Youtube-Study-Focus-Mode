# StudyTube Focus — YouTube Study & Focus Extension

**StudyTube Focus** is a browser extension designed to make YouTube a distraction-free study environment.

It helps you stay focused by hiding distracting content, tracking your daily YouTube study time, saving timestamp-based notes and organizing videos into study lists.

It also includes a **"Why Are You Here?" Focus Gate** that asks for your study goal before unlocking YouTube for 60 minutes.

## Features

### 1. Why Are You Here? Focus Gate
- Enter your study goal before accessing YouTube.
- Unlock YouTube for 60 minutes.
- View your remaining session time.
- YouTube locks again when the session expires.
- Enable or disable Focus Mode from the extension popup.

### 2. Daily YouTube Study Time
- Tracks time spent on active and visible YouTube tabs.
- Does not count background tabs or inactive browser windows.
- Displays your daily study time.
- Resets automatically when the calendar day changes.

### 3. Distraction-Free YouTube
Choose what you want to hide:
- YouTube Shorts
- Recommendations and Up Next
- Comments

The extension continues working when you move between videos without manually refreshing YouTube.

### 4. Timestamp Notes
- Save notes linked to specific video timestamps.
- Organize important learning points.
- Click a saved note to open the corresponding video at the saved moment.

### 5. Study Lists
- Organize videos into personal study lists.
- Keep useful learning resources together.

### 6. Persistent Local Storage
Your settings, study lists, timestamp notes, focus sessions and daily study time are saved locally using Chrome storage.

Your saved data is designed to survive browser restarts.

---

## Installation Guide

**You do not need to know programming to install this extension.**

You only need a Chromium-based browser such as Google Chrome or Brave.

### Step 1 — Download the Project

1. Open the StudyTube Focus GitHub repository:
   https://github.com/trishita924/YouTube-Study-Focus-Mode
2. Click this direct download link:

https://github.com/trishita924/YouTube-Study-Focus-Mode/archive/refs/heads/main.zip

3. The ZIP file will download automatically.
4. Open your Downloads folder and find the downloaded ZIP file.
5. Right-click it and select **Extract All**.
6. Open the extracted project folder.

Continue with Step 3 of the installation guide.

### Step 2 — Extract the ZIP file

1. Open your Downloads folder.
2. Find `YouTube-Study-Focus.zip`.
3. Right-click the ZIP file.
4. Select **Extract All**.
5. Open the extracted folder named `YouTube-Study-Focus`.

Make sure you can see these files and folders:

```text
YouTube-Study-Focus/
│
├── manifest.json
├── background.js
│
├── content/
│   ├── content.js
│   └── content.css
│
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
│
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 3 — Open the Extensions page

For Google Chrome, enter this in your address bar:

`chrome://extensions`

For Brave, enter:

`brave://extensions`

Press Enter.

### Step 4 — Enable Developer Mode

1. Find **Developer mode** in the top-right corner.
2. Turn the switch ON.

### Step 5 — Install StudyTube Focus

1. Click **Load unpacked**.
2. Navigate to the extracted `YouTube-Study-Focus` folder.
3. Select the folder that directly contains `manifest.json`.
4. Click **Select Folder**.

That's it! StudyTube Focus should now appear in your installed extensions.

### Step 6 — Pin the Extension

1. Click the puzzle-piece icon in your browser toolbar.
2. Find StudyTube Focus.
3. Click the pin icon to keep it easily accessible.

---

## How to Use

1. Open YouTube.
2. Enter your study goal in the **Why Are You Here?** Focus Gate.
3. Click **Unlock YouTube for 60 Minutes**.
4. Open the StudyTube Focus extension popup.
5. View your daily YouTube study time and remaining session time.
6. Toggle Shorts, Recommendations and Comments hiding.
7. Save videos in Study Lists.
8. Add timestamp notes while watching educational videos.

---

## Privacy

- No account or login is required.
- No backend server or database is required.
- Personal settings and study data are stored locally using browser storage.
- The extension does not require an external API.

---

## Important Notes

- This is a browser extension, not a normal website.
- Opening the GitHub Pages link does not automatically install the extension.
- Each user must download and install the extension using the steps above.
- The extension must remain installed and enabled to work on YouTube.
- If you download an updated version, you may need to load the updated folder through the Extensions page.

---

## Project Structure

- `manifest.json` — Extension configuration.
- `background.js` — Background functionality and persistent tracking.
- `content/` — YouTube page interaction and focus features.
- `popup/` — Extension popup interface.
- `icons/` — Extension icons.

---

## Testing Checklist

Before considering the project fully tested, verify:

- [ ] Focus Gate asks for a study goal.
- [ ] YouTube unlocks for 60 minutes.
- [ ] Countdown displays the remaining time.
- [ ] YouTube locks again after the session expires.
- [ ] Daily study time is tracked correctly.
- [ ] Shorts, recommendations and comments can be hidden.
- [ ] Features remain active when switching videos without reloading.
- [ ] Timestamp notes open the correct video moment.
- [ ] Study Lists save and load correctly.
- [ ] Saved data survives a complete browser restart.
- [ ] A friend can install the extension using only this guide.

---

**Built as a productivity project to make learning on YouTube more intentional and distraction-free.**

**Project:** StudyTube Focus  
**Type:** Browser Extension  
**Technology:** HTML, CSS, JavaScript, Chrome Extensions Manifest V3
