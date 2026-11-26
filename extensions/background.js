const DEFAULT_BLOCKED_WEBSITES = [
  "instagram.com",
  "youtube.com",
  "reddit.com",
  "pinterest.com",
  "twitter.com",
  "x.com"
];

const DEFAULT_STUDY_SESSIONS = [
  { start: 9 * 60, end: 13 * 60 },
  { start: 14 * 60, end: 18 * 60 }
];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    "isEnabled", "blockedWebsites", "customWebsites", "studySessions",
    "lockInMode", "tempBypassUntil", "roastLevel", "soundEnabled",
    "blockShorts", "customRoasts", "stats", "dailyHistory"
  ]);

  const todayStr = new Date().toDateString();
  const todayKey = getTodayKey();

  await chrome.storage.local.set({
    isEnabled: data.isEnabled ?? true,
    blockedWebsites: data.blockedWebsites ?? DEFAULT_BLOCKED_WEBSITES,
    customWebsites: data.customWebsites ?? [],
    studySessions: data.studySessions ?? DEFAULT_STUDY_SESSIONS,
    lockInMode: data.lockInMode ?? { active: false, endsAt: 0, duration: 25 },
    tempBypassUntil: data.tempBypassUntil ?? 0,
    roastLevel: data.roastLevel ?? "savage",
    soundEnabled: data.soundEnabled ?? true,
    blockShorts: data.blockShorts ?? true,
    customRoasts: data.customRoasts ?? [],
    stats: data.stats ?? {
      todayAttempts: 0,
      totalAttempts: 0,
      totalBypasses: 0,
      totalFocusMins: 0,
      lastActiveDate: todayStr,
      siteBreakdown: {},
      streakDays: 1,
      lastStreakDate: todayStr
    },
    dailyHistory: data.dailyHistory ?? {
      [todayKey]: { blocked: 0, bypasses: 0, focusMins: 0 }
    }
  });

  chrome.alarms.create("minuteHeartbeat", { periodInMinutes: 1 });
  await checkAndSyncBlocking();
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create("minuteHeartbeat", { periodInMinutes: 1 });
  await checkAndSyncBlocking();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "minuteHeartbeat" || alarm.name === "endLockIn" || alarm.name === "endBypass") {
    await checkAndSyncBlocking();
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && (
    changes.isEnabled || changes.blockedWebsites || changes.studySessions ||
    changes.lockInMode || changes.tempBypassUntil || changes.blockShorts
  )) {
    await checkAndSyncBlocking();
  }
});

function isWithinSession(startMin, endMin, currentMin) {
  if (startMin === endMin) return false;
  if (startMin < endMin) return currentMin >= startMin && currentMin < endMin;
  return currentMin >= startMin || currentMin < endMin;
}

async function checkAndSyncBlocking() {
  const data = await chrome.storage.local.get([
    "isEnabled", "blockedWebsites", "studySessions", "lockInMode",
    "tempBypassUntil", "blockShorts", "stats", "dailyHistory"
  ]);

  const isEnabled = data.isEnabled ?? true;
  const blockedWebsites = data.blockedWebsites ?? DEFAULT_BLOCKED_WEBSITES;
  const studySessions = data.studySessions ?? [];
  const lockInMode = data.lockInMode ?? { active: false, endsAt: 0 };
  const tempBypassUntil = data.tempBypassUntil ?? 0;
  const blockShorts = data.blockShorts ?? true;
  const now = Date.now();

  const isBypassed = tempBypassUntil > now;

  let isLockInActive = false;
  if (lockInMode.active) {
    if (lockInMode.endsAt > now) {
      isLockInActive = true;
    } else {
      const completedMins = lockInMode.duration || 25;
      const stats = data.stats || {};
      const dailyHistory = data.dailyHistory || {};
      const todayKey = getTodayKey();

      stats.totalFocusMins = (stats.totalFocusMins || 0) + completedMins;
      if (!dailyHistory[todayKey]) dailyHistory[todayKey] = { blocked: 0, bypasses: 0, focusMins: 0 };
      dailyHistory[todayKey].focusMins += completedMins;

      await chrome.storage.local.set({
        lockInMode: { active: false, endsAt: 0, duration: completedMins },
        stats,
        dailyHistory
      });

      if (chrome.notifications) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon128.png",
          title: "Lock-In Complete! 🔥",
          message: `+${completedMins}m Focus logged to your Dashboard!`
        });
      }
    }
  }

  const currentDate = new Date();
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  const isScheduledSession = studySessions.some((s) =>
    isWithinSession(s.start, s.end, currentMinutes)
  );

  const shouldBlock = isEnabled && !isBypassed && (isLockInActive || isScheduledSession);
  const shouldBlockShorts = isEnabled && !isBypassed && blockShorts;

  await applyDnrRules(blockedWebsites, shouldBlock, shouldBlockShorts);
  if (shouldBlock || shouldBlockShorts) {
    await redirectActiveBlockedTabs(blockedWebsites, shouldBlock, shouldBlockShorts);
  }

  updateExtensionBadge({
    isBypassed, tempBypassUntil, isLockInActive,
    lockInEndsAt: lockInMode.endsAt, shouldBlock
  });
}

async function redirectActiveBlockedTabs(blockedWebsites, shouldBlock, shouldBlockShorts) {
  if (!chrome.tabs) return;
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith("chrome-extension://")) continue;
      const lowerUrl = tab.url.toLowerCase();

      if (shouldBlockShorts && lowerUrl.includes("youtube.com/shorts")) {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("blocked.html?site=youtube.com%2Fshorts") });
        continue;
      }

      if (shouldBlock && blockedWebsites?.length > 0) {
        const matchedSite = blockedWebsites.find((s) => lowerUrl.includes(s.toLowerCase().trim()));
        if (matchedSite) {
          chrome.tabs.update(tab.id, {
            url: chrome.runtime.getURL(`blocked.html?site=${encodeURIComponent(matchedSite.trim().toLowerCase())}`)
          });
        }
      }
    }
  } catch (e) {}
}

let dnrQueue = Promise.resolve();

function applyDnrRules(blockedWebsites, shouldBlock, shouldBlockShorts) {
  dnrQueue = dnrQueue.then(async () => {
    try {
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const oldRuleIds = existingRules.map((r) => r.id);

      const newRules = [];
      if (shouldBlockShorts) {
        newRules.push({
          id: 999,
          priority: 2,
          action: { type: "redirect", redirect: { extensionPath: "/blocked.html?site=youtube.com%2Fshorts" } },
          condition: { urlFilter: "||youtube.com/shorts", resourceTypes: ["main_frame"] }
        });
      }

      if (shouldBlock && blockedWebsites?.length > 0) {
        const uniqueSites = Array.from(new Set(blockedWebsites.map((s) => s.trim().toLowerCase()).filter(Boolean)));
        uniqueSites.forEach((cleanSite, index) => {
          newRules.push({
            id: 1000 + index,
            priority: 1,
            action: { type: "redirect", redirect: { extensionPath: `/blocked.html?site=${encodeURIComponent(cleanSite)}` } },
            condition: { urlFilter: `||${cleanSite}`, resourceTypes: ["main_frame"] }
          });
        });
      }

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: newRules
      });
    } catch (err) {
      console.error("DNR sync error:", err);
    }
  });
  return dnrQueue;
}

function updateExtensionBadge({ isBypassed, tempBypassUntil, isLockInActive, lockInEndsAt, shouldBlock }) {
  if (isBypassed) {
    const mins = Math.max(1, Math.ceil((tempBypassUntil - Date.now()) / 60000));
    chrome.action.setBadgeText({ text: `${mins}m` });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
  } else if (isLockInActive) {
    const mins = Math.max(1, Math.ceil((lockInEndsAt - Date.now()) / 60000));
    chrome.action.setBadgeText({ text: `${mins}m` });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  } else if (shouldBlock) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BLOCKED_VISIT") {
    handleBlockedAttempt(message.site).then(sendResponse);
    return true;
  }
  if (message.type === "REQUEST_BYPASS") {
    handleBypassRequest(message.durationMinutes || 5, message.method || "shame").then(sendResponse);
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

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ ok: true, version: "3.0" });
    return true;
  }
  if (message.type === "GET_FULL_STATE") {
    chrome.storage.local.get(null).then((allData) => sendResponse({ ok: true, data: allData }));
    return true;
  }
  if (message.type === "UPDATE_SETTINGS") {
    chrome.storage.local.set(message.payload).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === "START_LOCKIN") {
    handleStartLockIn(message.durationMinutes || 25).then((res) => sendResponse({ ok: true, ...res }));
    return true;
  }
  if (message.type === "STOP_LOCKIN") {
    handleStopLockIn().then((res) => sendResponse({ ok: true, ...res }));
    return true;
  }
});

async function handleBlockedAttempt(rawSite) {
  const data = await chrome.storage.local.get(["stats", "dailyHistory"]);
  const todayStr = new Date().toDateString();
  const todayKey = getTodayKey();
  const site = (rawSite || "unknown").toLowerCase();

  let stats = data.stats || {
    todayAttempts: 0, totalAttempts: 0, totalBypasses: 0, totalFocusMins: 0,
    lastActiveDate: todayStr, siteBreakdown: {}, streakDays: 1, lastStreakDate: todayStr
  };
  let dailyHistory = data.dailyHistory || {};

  if (stats.lastActiveDate !== todayStr) {
    stats.todayAttempts = 0;
    stats.lastActiveDate = todayStr;
  }

  stats.todayAttempts = (stats.todayAttempts || 0) + 1;
  stats.totalAttempts = (stats.totalAttempts || 0) + 1;
  if (!stats.siteBreakdown) stats.siteBreakdown = {};
  stats.siteBreakdown[site] = (stats.siteBreakdown[site] || 0) + 1;

  if (!dailyHistory[todayKey]) dailyHistory[todayKey] = { blocked: 0, bypasses: 0, focusMins: 0 };
  dailyHistory[todayKey].blocked += 1;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (stats.lastStreakDate === yesterday) {
    stats.streakDays = (stats.streakDays || 1) + 1;
    stats.lastStreakDate = todayStr;
  } else if (stats.lastStreakDate !== todayStr) {
    stats.streakDays = 1;
    stats.lastStreakDate = todayStr;
  }

  await chrome.storage.local.set({ stats, dailyHistory });
  return { success: true, stats };
}

async function handleBypassRequest(minutes = 5, method = "shame") {
  const data = await chrome.storage.local.get(["stats", "dailyHistory"]);
  const todayKey = getTodayKey();
  const stats = data.stats || {};
  const dailyHistory = data.dailyHistory || {};

  if (method === "shame") {
    stats.totalBypasses = (stats.totalBypasses || 0) + 1;
    if (!dailyHistory[todayKey]) dailyHistory[todayKey] = { blocked: 0, bypasses: 0, focusMins: 0 };
    dailyHistory[todayKey].bypasses += 1;
  }

  const bypassUntil = Date.now() + minutes * 60 * 1000;
  await chrome.storage.local.set({ tempBypassUntil: bypassUntil, stats, dailyHistory });
  chrome.alarms.create("endBypass", { delayInMinutes: minutes });

  await checkAndSyncBlocking();
  return { success: true, bypassUntil };
}

async function handleStartLockIn(minutes = 25) {
  const endsAt = Date.now() + minutes * 60 * 1000;
  await chrome.storage.local.set({
    lockInMode: { active: true, endsAt, duration: minutes },
    tempBypassUntil: 0
  });
  chrome.alarms.create("endLockIn", { delayInMinutes: minutes });
  await checkAndSyncBlocking();
  return { success: true, endsAt };
}

async function handleStopLockIn() {
  await chrome.storage.local.set({ lockInMode: { active: false, endsAt: 0, duration: 25 } });
  await checkAndSyncBlocking();
  return { success: true };
}