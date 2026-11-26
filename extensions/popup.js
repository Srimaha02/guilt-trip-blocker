const DASHBOARD_URL = "https://guilt-trip-blocker.vercel.app";

let selectedLockInDuration = 25;
let timerTickInterval = null;

function to24Hour(hour12, ampm) {
  let h = parseInt(hour12, 10);
  if (ampm === "AM") { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return h;
}

function to12Hour(hour24) {
  const ampm = hour24 >= 12 ? "PM" : "AM";
  let h = hour24 % 12;
  if (h === 0) h = 12;
  return { hour12: h, ampm };
}

function formatMinutes(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const { hour12, ampm } = to12Hour(h24);
  return `${hour12}:${mins.toString().padStart(2, "0")} ${ampm}`;
}

function showToast(msg) {
  const toast = document.getElementById("toastMsg");
  toast.textContent = msg;
  setTimeout(() => { if (toast.textContent === msg) toast.textContent = ""; }, 2000);
}

// Show Extension ID & Open Dashboard button
document.getElementById("extIdLabel").textContent = chrome.runtime.id;
document.getElementById("openDashboardBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: `${DASHBOARD_URL}?extId=${chrome.runtime.id}` });
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const targetPane = document.getElementById(btn.dataset.tab);
    if (targetPane) targetPane.classList.add("active");
  });
});

function initHourDropdowns() {
  const startH = document.getElementById("startH");
  const endH = document.getElementById("endH");
  startH.innerHTML = "";
  endH.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const opt1 = document.createElement("option");
    opt1.value = i; opt1.textContent = i;
    if (i === 9) opt1.selected = true;
    startH.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = i; opt2.textContent = i;
    if (i === 5) opt2.selected = true;
    endH.appendChild(opt2);
  }
}

async function loadAllSettings() {
  const data = await chrome.storage.local.get([
    "isEnabled", "blockedWebsites", "customWebsites", "studySessions",
    "lockInMode", "tempBypassUntil", "roastLevel", "soundEnabled",
    "customRoasts", "blockShorts", "stats"
  ]);

  document.getElementById("masterToggle").checked = data.isEnabled ?? true;
  document.getElementById("blockShortsToggle").checked = data.blockShorts ?? true;

  renderLockInUI(data.lockInMode, data.tempBypassUntil);
  renderWebsitesList(data.blockedWebsites || [], data.customWebsites || []);
  renderSessionsList(data.studySessions || []);
  renderAnalytics(data.stats);
  renderRoastSettings(data.roastLevel, data.soundEnabled, data.customRoasts || []);
}

function renderLockInUI(lockInMode = {}, tempBypassUntil = 0) {
  clearInterval(timerTickInterval);
  const now = Date.now();
  const toggleBtn = document.getElementById("toggleLockInBtn");
  const timerClock = document.getElementById("timerClock");
  const statusBadge = document.getElementById("lockInStatus");
  const bypassCard = document.getElementById("bypassAlertCard");

  if (tempBypassUntil && tempBypassUntil > now) {
    bypassCard.style.display = "block";
    document.getElementById("bypassRemaining").textContent = `${Math.ceil((tempBypassUntil - now) / 60000)}m`;
  } else {
    bypassCard.style.display = "none";
  }

  if (lockInMode.active && lockInMode.endsAt > now) {
    statusBadge.textContent = "🔥 LOCKED IN";
    statusBadge.classList.add("active");
    toggleBtn.textContent = "🛑 Stop Lock-In";
    toggleBtn.className = "btn btn-danger";

    const updateClock = () => {
      const remainingSecs = Math.max(0, Math.floor((lockInMode.endsAt - Date.now()) / 1000));
      const m = Math.floor(remainingSecs / 60);
      const s = remainingSecs % 60;
      timerClock.textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      if (remainingSecs <= 0) { clearInterval(timerTickInterval); loadAllSettings(); }
    };
    updateClock();
    timerTickInterval = setInterval(updateClock, 1000);
  } else {
    statusBadge.textContent = "Ready to Focus";
    statusBadge.classList.remove("active");
    toggleBtn.textContent = `🔥 Start Lock-In (${selectedLockInDuration}m)`;
    toggleBtn.className = "btn btn-primary";
    timerClock.textContent = `${selectedLockInDuration.toString().padStart(2, "0")}:00`;
  }
}

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedLockInDuration = parseInt(btn.dataset.mins, 10);
    chrome.storage.local.get(["lockInMode"], (data) => {
      if (!data.lockInMode?.active) {
        document.getElementById("timerClock").textContent = `${selectedLockInDuration.toString().padStart(2, "0")}:00`;
        document.getElementById("toggleLockInBtn").textContent = `🔥 Start Lock-In (${selectedLockInDuration}m)`;
      }
    });
  });
});

document.getElementById("toggleLockInBtn").addEventListener("click", async () => {
  const data = await chrome.storage.local.get(["lockInMode"]);
  const isCurrentlyActive = data.lockInMode?.active && data.lockInMode.endsAt > Date.now();
  if (isCurrentlyActive) {
    chrome.runtime.sendMessage({ type: "STOP_LOCKIN" }, () => { showToast("Lock-in cancelled 🛡️"); loadAllSettings(); });
  } else {
    chrome.runtime.sendMessage({ type: "START_LOCKIN", durationMinutes: selectedLockInDuration }, () => {
      showToast(`Locked in for ${selectedLockInDuration}m! 🔥`); loadAllSettings();
    });
  }
});

document.getElementById("cancelBypassEarlyBtn").addEventListener("click", async () => {
  await chrome.storage.local.set({ tempBypassUntil: 0 });
  showToast("Break pass revoked 🛑");
  loadAllSettings();
});

function renderWebsitesList(blockedSites, customSites) {
  const container = document.getElementById("websitesContainer");
  container.innerHTML = "";
  const allSites = Array.from(new Set([...blockedSites, ...customSites]));
  document.getElementById("siteCountBadge").textContent = `${blockedSites.length} active`;

  allSites.forEach((site) => {
    const isChecked = blockedSites.includes(site);
    const isCustom = customSites.includes(site);
    const row = document.createElement("div");
    row.className = "site-item";
    const label = document.createElement("label");
    label.className = "site-label";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = isChecked;
    chk.addEventListener("change", async () => {
      const current = await chrome.storage.local.get(["blockedWebsites"]);
      let list = current.blockedWebsites || [];
      if (chk.checked) { if (!list.includes(site)) list.push(site); }
      else { list = list.filter((s) => s !== site); }
      await chrome.storage.local.set({ blockedWebsites: list });
      document.getElementById("siteCountBadge").textContent = `${list.length} active`;
      showToast(chk.checked ? `Blocked ${site}` : `Unblocked ${site}`);
    });

    label.appendChild(chk);
    label.appendChild(document.createTextNode(` ${site}`));
    row.appendChild(label);

    if (isCustom) {
      const delBtn = document.createElement("button");
      delBtn.className = "btn-icon";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", async () => {
        const cur = await chrome.storage.local.get(["blockedWebsites", "customWebsites"]);
        const updatedCustom = (cur.customWebsites || []).filter((s) => s !== site);
        const updatedBlocked = (cur.blockedWebsites || []).filter((s) => s !== site);
        await chrome.storage.local.set({ customWebsites: updatedCustom, blockedWebsites: updatedBlocked });
        renderWebsitesList(updatedBlocked, updatedCustom);
        showToast(`Removed ${site}`);
      });
      row.appendChild(delBtn);
    }
    container.appendChild(row);
  });
}

document.getElementById("addSiteBtn").addEventListener("click", async () => {
  const input = document.getElementById("newSiteInput");
  let raw = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split("?")[0];
  if (!raw || !raw.includes(".")) { showToast("Invalid domain (e.g. reddit.com)"); return; }

  const cur = await chrome.storage.local.get(["blockedWebsites", "customWebsites"]);
  const customWebsites = cur.customWebsites || [];
  const blockedWebsites = cur.blockedWebsites || [];
  if (customWebsites.includes(raw) || blockedWebsites.includes(raw)) { showToast("Already in list"); return; }

  customWebsites.push(raw);
  blockedWebsites.push(raw);
  await chrome.storage.local.set({ customWebsites, blockedWebsites });
  input.value = "";
  renderWebsitesList(blockedWebsites, customWebsites);
  showToast(`Added & blocked ${raw} ✅`);
});

document.getElementById("blockShortsToggle").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ blockShorts: e.target.checked });
  showToast(e.target.checked ? "YouTube Shorts Blocked 🎬" : "YouTube Shorts Allowed");
});

function renderSessionsList(sessions) {
  const container = document.getElementById("sessionsContainer");
  container.innerHTML = "";
  if (sessions.length === 0) {
    container.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 6px;">No daily sessions set.</div>`;
    return;
  }
  sessions.forEach((s, idx) => {
    const item = document.createElement("div");
    item.className = "session-item";
    const title = document.createElement("span");
    title.innerHTML = `<strong>Block ${idx + 1}:</strong> ${formatMinutes(s.start)} → ${formatMinutes(s.end)} ${s.start > s.end ? "🌙" : ""}`;
    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", async () => {
      const cur = await chrome.storage.local.get(["studySessions"]);
      const updated = cur.studySessions || [];
      updated.splice(idx, 1);
      await chrome.storage.local.set({ studySessions: updated });
      renderSessionsList(updated);
      showToast("Session removed");
    });
    item.appendChild(title);
    item.appendChild(delBtn);
    container.appendChild(item);
  });
}

document.getElementById("saveSessionBtn").addEventListener("click", async () => {
  const startTotal = to24Hour(document.getElementById("startH").value, document.getElementById("startAP").value) * 60 + parseInt(document.getElementById("startM").value, 10);
  const endTotal = to24Hour(document.getElementById("endH").value, document.getElementById("endAP").value) * 60 + parseInt(document.getElementById("endM").value, 10);
  if (startTotal === endTotal) { showToast("Start and end time cannot be same"); return; }
  const cur = await chrome.storage.local.get(["studySessions"]);
  const list = cur.studySessions || [];
  list.push({ start: startTotal, end: endTotal });
  await chrome.storage.local.set({ studySessions: list });
  renderSessionsList(list);
  showToast("Study session added ✅");
});

document.getElementById("masterToggle").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ isEnabled: e.target.checked });
  showToast(e.target.checked ? "Blocker Enabled 🛡️" : "Blocker Paused ⏸️");
});

function renderAnalytics(stats = {}) {
  const today = stats.todayAttempts || 0;
  const total = stats.totalAttempts || 0;
  const streak = stats.streakDays || 1;
  const timeSavedMins = today * 15;
  document.getElementById("statsTodayBlocked").textContent = today;
  document.getElementById("statsTimeSaved").textContent = timeSavedMins >= 60 ? `${(timeSavedMins / 60).toFixed(1)}h` : `${timeSavedMins}m`;
  document.getElementById("statsStreak").textContent = `${streak} 🔥`;
  document.getElementById("statsAllTime").textContent = total;

  const breakdownContainer = document.getElementById("siteBreakdownList");
  const siteEntries = Object.entries(stats.siteBreakdown || {}).sort((a, b) => b[1] - a[1]);
  if (siteEntries.length === 0) {
    breakdownContainer.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px;">No distraction attempts yet!</div>`;
    return;
  }
  breakdownContainer.innerHTML = "";
  siteEntries.forEach(([site, count]) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `<span>${site}</span><strong style="color: var(--rose);">${count}x</strong>`;
    breakdownContainer.appendChild(row);
  });
}

function renderRoastSettings(roastLevel = "savage", soundEnabled = true, customRoasts = []) {
  document.getElementById("roastLevelSelect").value = roastLevel;
  document.getElementById("soundToggle").checked = soundEnabled;
  const roastsList = document.getElementById("customRoastsList");
  roastsList.innerHTML = "";
  customRoasts.forEach((quote, idx) => {
    const row = document.createElement("div");
    row.className = "session-item";
    row.style.fontSize = "11px";
    const text = document.createElement("span");
    text.textContent = quote;
    const del = document.createElement("button");
    del.className = "btn-icon";
    del.textContent = "✕";
    del.addEventListener("click", async () => {
      const cur = await chrome.storage.local.get(["customRoasts"]);
      const updated = cur.customRoasts || [];
      updated.splice(idx, 1);
      await chrome.storage.local.set({ customRoasts: updated });
      renderRoastSettings(roastLevel, soundEnabled, updated);
      showToast("Roast deleted");
    });
    row.appendChild(text);
    row.appendChild(del);
    roastsList.appendChild(row);
  });
}

document.getElementById("roastLevelSelect").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ roastLevel: e.target.value });
  showToast("Roast level updated ⚡");
});

document.getElementById("soundToggle").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ soundEnabled: e.target.checked });
  showToast(e.target.checked ? "Sound enabled 🔊" : "Sound muted 🔇");
});

document.getElementById("addRoastBtn").addEventListener("click", async () => {
  const input = document.getElementById("newRoastInput");
  const quote = input.value.trim();
  if (!quote) return;
  const cur = await chrome.storage.local.get(["customRoasts"]);
  const list = cur.customRoasts || [];
  list.push(quote);
  await chrome.storage.local.set({ customRoasts: list });
  input.value = "";
  const curSettings = await chrome.storage.local.get(["roastLevel", "soundEnabled"]);
  renderRoastSettings(curSettings.roastLevel, curSettings.soundEnabled, list);
  showToast("Custom roast added 🔥");
});

initHourDropdowns();
loadAllSettings();