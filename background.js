// Default study hours (24-hr format) - user can change via popup
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 18;

// Rule IDs from rules.json - used to enable/disable
const RULE_IDS = [1, 2, 3];

// Check current time and enable/disable blocking accordingly
async function checkStudyHours() {
  const data = await chrome.storage.local.get(["startHour", "endHour", "isEnabled"]);
  const startHour = data.startHour ?? DEFAULT_START_HOUR;
  const endHour = data.endHour ?? DEFAULT_END_HOUR;
  const isEnabled = data.isEnabled ?? true;

  const now = new Date();
  const currentHour = now.getHours();

  const withinStudyHours = currentHour >= startHour && currentHour < endHour;
  const shouldBlock = isEnabled && withinStudyHours;

  if (shouldBlock) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ["ruleset_1"]
    });
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ["ruleset_1"]
    });
  }
}

// Run check every time the extension starts
chrome.runtime.onStartup.addListener(checkStudyHours);
chrome.runtime.onInstalled.addListener(checkStudyHours);

// Run check every 15 minutes using alarms
chrome.alarms.create("studyHourCheck", { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "studyHourCheck") {
    checkStudyHours();
  }
});

// Also re-check whenever storage changes (user updates settings in popup)
chrome.storage.onChanged.addListener(() => {
  checkStudyHours();
});

// Track streak - increment when a block happens (message from blocked.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BLOCKED_VISIT") {
    incrementStreak();
  }
});

async function incrementStreak() {
  const data = await chrome.storage.local.get(["streakToday", "lastBlockDate"]);
  const today = new Date().toDateString();

  let streakToday = data.streakToday ?? 0;

  if (data.lastBlockDate !== today) {
    streakToday = 0; // reset for new day
  }

  streakToday += 1;

  await chrome.storage.local.set({
    streakToday,
    lastBlockDate: today
  });
}