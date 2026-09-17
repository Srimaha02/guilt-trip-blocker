// Convert 12-hour + AM/PM to 24-hour format
function to24Hour(hour12, ampm) {
  let hour = parseInt(hour12, 10);
  if (ampm === "AM") {
    if (hour === 12) hour = 0; // 12 AM = 0
  } else {
    if (hour !== 12) hour += 12; // PM, except 12 PM stays 12
  }
  return hour;
}

// Convert 24-hour back to 12-hour + AM/PM for display
function to12Hour(hour24) {
  let ampm = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, ampm };
}

async function loadSettings() {
  const data = await chrome.storage.local.get([
  "startHour",
  "endHour",
  "isEnabled",
  "streakToday",
  "lastBlockDate",
  "blockedWebsites"
]);
const blockedWebsites = data.blockedWebsites ?? [
  "instagram.com",
  "youtube.com",
  "reddit.com"
];

document.querySelectorAll(".website-checkbox").forEach((checkbox) => {
  checkbox.checked = blockedWebsites.includes(checkbox.value);
});

  const startHour24 = data.startHour ?? 9;
  const endHour24 = data.endHour ?? 18;

  const start12 = to12Hour(startHour24);
  const end12 = to12Hour(endHour24);

  document.getElementById("startHour12").value = start12.hour12;
  document.getElementById("startAmPm").value = start12.ampm;
  document.getElementById("endHour12").value = end12.hour12;
  document.getElementById("endAmPm").value = end12.ampm;

  document.getElementById("enabledToggle").checked = data.isEnabled ?? true;

  const today = new Date().toDateString();
  const streak = data.lastBlockDate === today ? (data.streakToday ?? 0) : 0;
  document.getElementById("streakDisplay").textContent =
    streak > 0 ? `🔥 Resisted ${streak} time(s) today` : "No slip-ups yet today 👍";
}

async function saveSettings() {
  const startHour12 = document.getElementById("startHour12").value;
  const startAmPm = document.getElementById("startAmPm").value;
  const endHour12 = document.getElementById("endHour12").value;
  const endAmPm = document.getElementById("endAmPm").value;
  const isEnabled = document.getElementById("enabledToggle").checked;
  const blockedWebsites = Array.from(
  document.querySelectorAll(".website-checkbox:checked")
).map((checkbox) => checkbox.value);

  if (!startHour12 || !endHour12 || startHour12 < 1 || startHour12 > 12 || endHour12 < 1 || endHour12 > 12) {
    document.getElementById("statusMsg").textContent = "Enter valid hour (1-12) da.";
    return;
  }

  const startHour = to24Hour(startHour12, startAmPm);
  const endHour = to24Hour(endHour12, endAmPm);

  if (startHour >= endHour) {
    document.getElementById("statusMsg").textContent = "Start time end time-ku munnadi irukanum.";
    return;
  }

await chrome.storage.local.set({
  startHour,
  endHour,
  isEnabled,
  blockedWebsites
});
  document.getElementById("statusMsg").textContent = "Saved ✅";
  setTimeout(() => {
    document.getElementById("statusMsg").textContent = "";
  }, 1500);
}

document.getElementById("saveBtn").addEventListener("click", saveSettings);

loadSettings();