// Default study hours (24-hour format)
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 18;


// Check current time and update blocking rules
async function checkStudyHours() {
  const data = await chrome.storage.local.get([
    "startHour",
    "endHour",
    "isEnabled",
    "blockedWebsites"
  ]);

  const startHour = data.startHour ?? DEFAULT_START_HOUR;
  const endHour = data.endHour ?? DEFAULT_END_HOUR;
  const isEnabled = data.isEnabled ?? true;
  const blockedWebsites = data.blockedWebsites ?? [];

  const currentHour = new Date().getHours();

  const withinStudyHours =
    currentHour >= startHour && currentHour < endHour;

  const shouldBlock = isEnabled && withinStudyHours;

  console.log("Study hours:", withinStudyHours);
  console.log("Blocking enabled:", shouldBlock);
  console.log("Selected websites:", blockedWebsites);

  await updateBlockingRules(blockedWebsites, shouldBlock);
}


// Create dynamic blocking rules
async function updateBlockingRules(blockedWebsites, shouldBlock) {

  // Get currently existing dynamic rules
  const existingRules =
    await chrome.declarativeNetRequest.getDynamicRules();

  // Get their IDs
  const oldRuleIds = existingRules.map(rule => rule.id);

  // Remove old dynamic rules
  if (oldRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds
    });
  }

  // If blocking is not active, don't add any rules
  if (!shouldBlock) {
    console.log("Blocking is currently OFF");
    return;
  }

  // Create rules for selected websites
  const newRules = blockedWebsites.map((website, index) => ({
    id: 1000 + index,
    priority: 1,

    action: {
      type: "redirect",
      redirect: {
        extensionPath: "/blocked.html"
      }
    },

    condition: {
      urlFilter: `||${website}/`,
      resourceTypes: ["main_frame"]
    }
  }));

  // Add the new rules
  if (newRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });

    console.log("Dynamic rules added:", newRules);
  } else {
    console.log("No websites selected");
  }
}


// Run when extension starts
chrome.runtime.onStartup.addListener(() => {
  checkStudyHours();
});


// Run when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  checkStudyHours();
});


// Check every 15 minutes
chrome.alarms.create("studyHourCheck", {
  periodInMinutes: 15
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "studyHourCheck") {
    checkStudyHours();
  }
});


// Re-check whenever popup settings change
chrome.storage.onChanged.addListener(() => {
  checkStudyHours();
});


// Track blocked visits
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "BLOCKED_VISIT") {
    incrementStreak();
  }
});


async function incrementStreak() {
  const data = await chrome.storage.local.get([
    "streakToday",
    "lastBlockDate"
  ]);

  const today = new Date().toDateString();

  let streakToday = data.streakToday ?? 0;

  if (data.lastBlockDate !== today) {
    streakToday = 0;
  }

  streakToday += 1;

  await chrome.storage.local.set({
    streakToday,
    lastBlockDate: today
  });
}