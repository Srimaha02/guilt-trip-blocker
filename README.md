# 🚫 Guilt Trip Blocker (Manifest V3)

> A modern, humorous, and high-friction website blocker built for students and developers. Combines scheduled study hours, instant Pomodoro lock-in, and savage Tanglish guilt-trips to kill distractions before they kill your future.

---

## ✨ Key Features

### 1. ⏱️ Instant Pomodoro Lock-In Mode
- **Quick Focus Sessions:** One-click presets (25m, 50m, 90m) or custom durations.
- **Dynamic Badge Countdown:** Real-time remaining time badge directly on the Chrome toolbar icon (e.g. `24m` in red, `PASS` in green).
- **Desktop Completion Alerts:** Native Chrome notifications once your focus block finishes.

### 2. 🚨 The Walk of Shame (Friction Bypass Mechanic)
- Unlike simple blockers where disabling is a single click, users must face psychological resistance.
- **Mandatory 15-second cool-off timer** to halt impulse browsing.
- **Verbatim penalty phrase typing** (e.g. *"Naan self-control illadha aalu, en future-a vida reels dhaan mukkiyam"*) before an emergency 5-minute pass unlocks.
- Auto-locks again immediately after the 5-minute grace period expires.

### 3. 🎭 Savage Tanglish Roasts & Roast Lab
- **Cultural Humor & Realism:** Relatable student roasts (*"Study video thedi vandhu, recommendation-la 17 videos later... enna da research?"*).
- **Roast Intensity Levels:**
  - `🌱 Gentle Reminder` — Encouraging, mindful prompts.
  - `⚡ Tanglish Savage (Default)` — Punchy, humorous Tamil + English roasts.
  - `🪓 Hardcore Brutal` — High-intensity wake-up calls.
- **Custom Roasts:** Add your own personalized quotes or friend banter.
- **Audio Synthesizer Alert:** Built-in Web Audio API alert sound when landing on a blocked page.

### 4. 📊 Productivity & Distraction Analytics
- **Impulse Counter:** Tracks exact distraction attempts blocked per day and all-time.
- **Estimated Time Saved:** Automatically estimates hours saved from impulse rabbit-holes (15 mins saved per blocked distraction).
- **Distraction Trap Breakdown:** Per-site rankings showing which sites (YouTube, Instagram, Reddit, etc.) you slip up on most.
- **Daily Streak Counter:** Consecutive days active in focus mode.

### 5. 🛡️ Overnight-Aware Study Hour Rules
- Supports flexible daily study blocks.
- **Cross-Midnight Support:** Works seamlessly for late-night study sessions (e.g., `10:00 PM → 02:00 AM`).
- **One-Click Site Management:** Instantly toggle or add any custom domain without reloading.

---

## 🛠️ Architecture & Tech Stack

- **Platform:** Chrome Extension (Manifest V3)
- **Network Engine:** Chrome `declarativeNetRequest` (Dynamic Rules API for low-overhead blocking)
- **State Management:** `chrome.storage.local` with real-time `storage.onChanged` event syncing
- **Background Worker:** Event-driven Service Worker with `chrome.alarms` heartbeat
- **Sound:** Web Audio API oscillator synthesis (no external audio assets required)
- **Styling:** Vanilla CSS with custom glassmorphism design system

---

## 🚀 How to Install & Run Locally

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select this project folder (`guilt-trip-blocker`).
6. Pin the extension to your toolbar and lock in! 🔥
