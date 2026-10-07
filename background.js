// Default Configuration & State
const DEFAULT_BLOCKED_WEBSITES = [
  "instagram.com",
  "youtube.com",
  "reddit.com",
  "pinterest.com",
  "twitter.com",
  "x.com"
];

const DEFAULT_STUDY_SESSIONS = [
  { start: 9 * 60, end: 13 * 60 },  // 09:00 AM - 01:00 PM
  { start: 14 * 60, end: 18 * 60 }  // 02:00 PM - 06:00 PM
];

// Initialize default storage on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    "isEnabled",
    "blockedWebsites",
    "customWebsites",
    "studySessions",
    "lockInMode",
    "tempBypassUntil",
    "roastLevel",
    "soundEnabled",
    "stats"
  ]);

  const today = new Date().toDateString();

  const initialData = {
    isEnabled: data.isEnabled ?? true,
    blockedWebsites: data.blockedWebsites ?? DEFAULT_BLOCKED_WEBSITES,
    customWebsites: data.customWebsites ?? [],
    studySessions: data.studySessions ?? DEFAULT_STUDY_SESSIONS,
    lockInMode: data.lockInMode ?? { active: false, endsAt: 0, duration: 25 },
    tempBypassUntil: data.tempBypassUntil ?? 0,
    roastLevel: data.roastLevel ?? "savage",
    soundEnabled: data.soundEnabled ?? true,
    stats: data.stats ?? {
      todayAttempts: 0,
      totalAttempts: 0,
      lastActiveDate: today,
      siteBreakdown: {},
      streakDays: 1,
      lastStreakDate: today
    }
  };

  await chrome.storage.local.set(initialData);

  // Set recurring alarm every 1 minute
  chrome.alarms.create("minuteHeartbeat", { periodInMinutes: 1 });

  await checkAndSyncBlocking();
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create("minuteHeartbeat", { periodInMinutes: 1 });
  await checkAndSyncBlocking();
});

// Periodic alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "minuteHeartbeat" || alarm.name === "endLockIn" || alarm.name === "endBypass") {
    await checkAndSyncBlocking();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local") {
    if (
      changes.isEnabled ||
      changes.blockedWebsites ||
      changes.studySessions ||
      changes.lockInMode ||
      changes.tempBypassUntil
    ) {
      await checkAndSyncBlocking();
    }
  }
});

// Helper: Check if current minute is within session (handles overnight wraparound)
function isWithinSession(startMin, endMin, currentMin) {
  if (startMin === endMin) return false;
  if (startMin < endMin) {
    return currentMin >= startMin && currentMin < endMin;
  }
  // Overnight session e.g. 22:00 (1320) to 02:00 (120)
  return currentMin >= startMin || currentMin < endMin;
}

// Core evaluation function
async function checkAndSyncBlocking() {
  const data = await chrome.storage.local.get([
    "isEnabled",
    "blockedWebsites",
    "studySessions",
    "lockInMode",
    "tempBypassUntil",
    "stats"
  ]);

  const isEnabled = data.isEnabled ?? true;
  const blockedWebsites = data.blockedWebsites ?? DEFAULT_BLOCKED_WEBSITES;
  const studySessions = data.studySessions ?? [];
  const lockInMode = data.lockInMode ?? { active: false, endsAt: 0 };
  const tempBypassUntil = data.tempBypassUntil ?? 0;
  const now = Date.now();

  // 1. Check Temporary Bypass
  const isBypassed = tempBypassUntil > now;

  // 2. Check Lock-in / Pomodoro Mode
  let isLockInActive = false;
  if (lockInMode.active) {
    if (lockInMode.endsAt > now) {
      isLockInActive = true;
    } else {
      // Lock-in expired!
      await chrome.storage.local.set({
        lockInMode: { active: false, endsAt: 0, duration: lockInMode.duration || 25 }
      });
      // Fire desktop notification
      if (chrome.notifications) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon128.png",
          title: "Lock-In Complete! 🔥",
          message: "Massive win! You stayed laser-focused. Take a well-deserved break."
        });
      }
    }
  }

  // 3. Check Scheduled Study Sessions
  const currentDate = new Date();
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  const isScheduledSession = studySessions.some((s) =>
    isWithinSession(s.start, s.end, currentMinutes)
  );

  // Overall blocking decision
  const shouldBlock = isEnabled && !isBypassed && (isLockInActive || isScheduledSession);

  // Update Dynamic Rules
  await applyDnrRules(blockedWebsites, shouldBlock);

  // If blocking is active, redirect any tabs that are currently already open
  if (shouldBlock) {
    await redirectActiveBlockedTabs(blockedWebsites);
  }

  // Update Extension Icon Badge
  updateExtensionBadge({
    isBypassed,
    tempBypassUntil,
    isLockInActive,
    lockInEndsAt: lockInMode.endsAt,
    shouldBlock
  });
}

// Redirect any open tabs that match blocked websites
async function redirectActiveBlockedTabs(blockedWebsites) {
  if (!chrome.tabs || !blockedWebsites || blockedWebsites.length === 0) return;
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.url) continue;
      const lowerUrl = tab.url.toLowerCase();
      const isBlocked = blockedWebsites.some((site) => {
        const clean = site.toLowerCase().trim();
        return lowerUrl.includes(clean);
      });
      if (isBlocked && !lowerUrl.startsWith("chrome-extension://")) {
        chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL("blocked.html")
        });
      }
    }
  } catch (e) {
    console.warn("Tab redirect error:", e);
  }
}

// Apply or remove DeclarativeNetRequest dynamic rules
async function applyDnrRules(blockedWebsites, shouldBlock) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = existingRules.map((r) => r.id);

    if (oldRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds
      });
    }

    if (!shouldBlock || !blockedWebsites || blockedWebsites.length === 0) {
      return;
    }

    const newRules = blockedWebsites.map((site, index) => {
      const cleanSite = site.trim().toLowerCase();
      return {
        id: 1000 + index,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            extensionPath: "/blocked.html"
          }
        },
        condition: {
          urlFilter: `||${cleanSite}`,
          resourceTypes: ["main_frame"]
        }
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });
  } catch (err) {
    console.error("Failed to update dynamic DNR rules:", err);
  }
}

// Extension Badge UI indicator
function updateExtensionBadge({ isBypassed, tempBypassUntil, isLockInActive, lockInEndsAt, shouldBlock }) {
  if (isBypassed) {
    const remainingSecs = Math.max(0, Math.ceil((tempBypassUntil - Date.now()) / 1000));
    const mins = Math.ceil(remainingSecs / 60);
    chrome.action.setBadgeText({ text: `${mins}m` });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" }); // Emerald Green
  } else if (isLockInActive) {
    const remainingMins = Math.max(1, Math.ceil((lockInEndsAt - Date.now()) / 60000));
    chrome.action.setBadgeText({ text: `${remainingMins}m` });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Crimson Red
  } else if (shouldBlock) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1" }); // Indigo
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Runtime message handler for Analytics & Bypass Requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BLOCKED_VISIT") {
    handleBlockedAttempt(message.site).then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === "REQUEST_BYPASS") {
    handleBypassRequest(message.durationMinutes || 5).then(sendResponse);
    return true;
  }

  if (message.type === "START_LOCKIN") {
    handleStartLockIn(message.durationMinutes || 25).then(sendResponse);
    return true;
  }

  if (message.type === "STOP_LOCKIN") {
    handleStopLockIn().then(sendResponse);
    return true;
  }
});

// Analytics: record blocked visit attempt & maintain streaks
async function handleBlockedAttempt(rawSite) {
  const data = await chrome.storage.local.get(["stats"]);
  const today = new Date().toDateString();
  const site = (rawSite || "unknown").toLowerCase();

  let stats = data.stats || {
    todayAttempts: 0,
    totalAttempts: 0,
    lastActiveDate: today,
    siteBreakdown: {},
    streakDays: 1,
    lastStreakDate: today
  };

  // Reset daily attempts if a new day started
  if (stats.lastActiveDate !== today) {
    stats.todayAttempts = 0;
    stats.lastActiveDate = today;
  }

  stats.todayAttempts = (stats.todayAttempts || 0) + 1;
  stats.totalAttempts = (stats.totalAttempts || 0) + 1;

  if (!stats.siteBreakdown) stats.siteBreakdown = {};
  stats.siteBreakdown[site] = (stats.siteBreakdown[site] || 0) + 1;

  // Streak logic: if active on consecutive days
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (stats.lastStreakDate === yesterday) {
    stats.streakDays = (stats.streakDays || 1) + 1;
    stats.lastStreakDate = today;
  } else if (stats.lastStreakDate !== today) {
    stats.streakDays = 1;
    stats.lastStreakDate = today;
  }

  await chrome.storage.local.set({ stats });
  return { success: true, stats };
}

// Friction Bypass: grants 5 minutes pass after penalty completed
async function handleBypassRequest(minutes = 5) {
  const bypassUntil = Date.now() + minutes * 60 * 1000;
  await chrome.storage.local.set({ tempBypassUntil: bypassUntil });

  // Create alarm to expire bypass precisely
  chrome.alarms.create("endBypass", { delayInMinutes: minutes });

  await checkAndSyncBlocking();
  return { success: true, bypassUntil };
}

// Start Lock-In (Pomodoro)
async function handleStartLockIn(minutes = 25) {
  const endsAt = Date.now() + minutes * 60 * 1000;
  await chrome.storage.local.set({
    lockInMode: { active: true, endsAt, duration: minutes },
    tempBypassUntil: 0 // cancel any active bypass
  });

  chrome.alarms.create("endLockIn", { delayInMinutes: minutes });
  await checkAndSyncBlocking();
  return { success: true, endsAt };
}

// Stop Lock-In early
async function handleStopLockIn() {
  await chrome.storage.local.set({
    lockInMode: { active: false, endsAt: 0, duration: 25 }
  });
  await checkAndSyncBlocking();
  return { success: true };
}