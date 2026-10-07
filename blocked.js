// Guilt Trip Roasts Catalog grouped by level and context
const ROASTS_SAVAGE = [
  { emoji: "🫵", text: "Dei. Padikka mudiyala nu illa. Nee padikka virumbala. Difference purinjiko." },
  { emoji: "▶️", text: "YouTube-la oru video paakalam nu vandha? Unakku theriyum adhu oru video-la stop aagadhu." },
  { emoji: "💀", text: "\"One video only\" nu sonna nee dhaana? History-ku un character vera story solludhu." },
  { emoji: "😂", text: "Study video thedi vandhu, recommendation-la 17 videos later... enna da research?" },
  { emoji: "📱", text: "Social media open panna 0.2 seconds. Problem solve panna loading screen. Semma priorities." },
  { emoji: "🫠", text: "Nee tired illa da. Distracted. Rendu perukkum difference irukku." },
  { emoji: "📌", text: "Pinterest-la inspiration thedura? Inspiration kidaichiduchu, ippo actual work pannalama?" },
  { emoji: "😭", text: "\"Just getting ideas\" nu 1 hour waste aachu. Idea vandhucha? Illa regret mattum aacha?" },
  { emoji: "🤡", text: "Un dream list aesthetic ah irukku. Aana un actual daily progress enga da?" },
  { emoji: "😤", text: "Un potential-ku problem illa. Un \"Later\" dhaan un full-time villain." },
  { emoji: "⏳", text: "Time unakku wait panna maatadhu. Nee dhaan time-a waste pannitu irukka." },
  { emoji: "🔥", text: "Recommendation feed build panna poriya? Illa future career build panna poriya?" },
  { emoji: "🎬", text: "Interval mudinjiduchu da. Second half-la aavadhu konjam serious-aa iru." },
  { emoji: "🧠", text: "Room decor save pannita. Ippo semester pass aaguradhukku konjam work pannu." },
  { emoji: "⚡", text: "Mood varattum nu wait pannadha. Work start pannina dhaan mood varum." },
  { emoji: "🏃", text: "Vaa da. Escape illa. Study desk-ku thirumbi po." }
];

const ROASTS_HARDCORE = [
  { emoji: "🪓", text: "Bro, un competitors ippo padichitu irukaanga. Nee inga reel scroll pannitu irukka. All the best." },
  { emoji: "☠️", text: "Exam hall-la poi \"Guilt trip blocker quote semmaya irundhuchu\" nu dhaan ezhudha poriya?" },
  { emoji: "📉", text: "Zero self-control. Zero discipline. Future-la question paper paathu azha ready-aa?" },
  { emoji: "🔥", text: "Innaiku skip pannina easy. Naalaiku life-la compromise panna romba kashdam." },
  { emoji: "🗿", text: "Excuses produce panradhula PhD vaangiruka pola. Book-a open pannu modhalla." }
];

const ROASTS_GENTLE = [
  { emoji: "🌱", text: "Take a deep breath. A small step right now is better than scrolling for an hour." },
  { emoji: "🎯", text: "Remember why you started. Focus on just 25 minutes of honest work." },
  { emoji: "✨", text: "Progress is made one focused session at a time. You've got this!" },
  { emoji: "⏳", text: "The impulse will pass in 2 minutes. Protect your attention." }
];

const PENALTY_SENTENCES = [
  "Naan self-control illadha aalu, en future-a vida reels dhaan mukkiyam.",
  "I admit I am weak against algorithms and choosing instant dopamine over hard work.",
  "Naan focus panna mudiyama surrender panniten, give me 5 minutes walk of shame.",
  "I have zero discipline right now and I take full responsibility for wasting my time."
];

// Determine blocked site from query parameter or document.referrer
const urlParams = new URLSearchParams(window.location.search);
let blockedSite = urlParams.get("site");

if (!blockedSite && document.referrer) {
  try {
    const refHost = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (refHost) blockedSite = refHost;
  } catch (e) {}
}

if (!blockedSite) {
  blockedSite = "Distraction";
}

// Audio Alert using Web Audio API (Synthesizer boing / alert)
function playBlockSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // Audio autoplay restrictions or context failure
  }
}

// Render dynamic roast quote
async function loadRoast() {
  const data = await chrome.storage.local.get([
    "roastLevel",
    "customRoasts",
    "soundEnabled"
  ]);

  if (data.soundEnabled !== false) {
    playBlockSound();
  }

  const level = data.roastLevel || "savage";
  let pool = [...ROASTS_SAVAGE];

  if (level === "gentle") {
    pool = [...ROASTS_GENTLE];
    document.getElementById("levelBadge").textContent = "🌱 Gentle Reminder";
  } else if (level === "hardcore") {
    pool = [...ROASTS_HARDCORE, ...ROASTS_SAVAGE];
    document.getElementById("levelBadge").textContent = "🪓 Hardcore Brutal";
  } else {
    document.getElementById("levelBadge").textContent = "⚡ Tanglish Savage";
  }

  // Include user custom roasts if any
  if (Array.isArray(data.customRoasts) && data.customRoasts.length > 0) {
    data.customRoasts.forEach(r => pool.push({ emoji: "👀", text: r }));
  }

  const random = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById("emojiBox").textContent = random.emoji;
  document.getElementById("roastText").textContent = random.text;
  document.getElementById("siteBadge").textContent = `🚫 Blocked: ${blockedSite}`;
}

// Refresh stats and streak
async function updateStatsUI() {
  const data = await chrome.storage.local.get(["stats"]);
  const stats = data.stats || {};
  const todayCount = stats.todayAttempts || 0;
  const timeSavedMins = todayCount * 15; // Estimate 15m saved per resisted impulse
  const streakDays = stats.streakDays || 1;

  document.getElementById("statToday").textContent = todayCount;
  document.getElementById("statTimeSaved").textContent =
    timeSavedMins >= 60 ? `${(timeSavedMins / 60).toFixed(1)} hrs` : `${timeSavedMins} mins`;
  document.getElementById("statStreak").textContent = `${streakDays} Day${streakDays > 1 ? "s" : ""}`;

  document.getElementById("streakBadge").textContent =
    todayCount > 0 ? `🔥 Resisted ${todayCount}x Today` : "🛡️ Clean Slate Today";
}

// Notify background to increment attempt stats
async function recordVisit() {
  chrome.runtime.sendMessage({
    type: "BLOCKED_VISIT",
    site: blockedSite
  }, (res) => {
    if (res && res.stats) {
      updateStatsUI();
    }
  });
}

// Setup Event Listeners
document.getElementById("rerollRoastBtn").addEventListener("click", () => {
  loadRoast();
});

document.getElementById("closeTabBtn").addEventListener("click", () => {
  window.close();
  // If window.close() blocked by browser:
  setTimeout(() => {
    window.location.href = "https://www.google.com";
  }, 150);
});

document.getElementById("studyRedirectBtn").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "https://leetcode.com";
});

// Friction / Give Up Modal Logic
const modal = document.getElementById("frictionModal");
const penaltyTargetEl = document.getElementById("penaltySentence");
const penaltyInputEl = document.getElementById("penaltyInput");
const cooldownTimerEl = document.getElementById("cooldownTimer");
const confirmBypassBtn = document.getElementById("confirmBypassBtn");

let cooldownSeconds = 15;
let cooldownInterval = null;
let currentPenalty = "";

document.getElementById("giveUpLink").addEventListener("click", () => {
  modal.style.display = "flex";
  currentPenalty = PENALTY_SENTENCES[Math.floor(Math.random() * PENALTY_SENTENCES.length)];
  penaltyTargetEl.textContent = currentPenalty;
  penaltyInputEl.value = "";
  penaltyInputEl.focus();

  cooldownSeconds = 15;
  confirmBypassBtn.classList.remove("enabled");
  confirmBypassBtn.disabled = true;

  clearInterval(cooldownInterval);
  cooldownTimerEl.textContent = `⏳ Mandatory cool-off: ${cooldownSeconds}s remaining`;

  cooldownInterval = setInterval(() => {
    cooldownSeconds--;
    if (cooldownSeconds > 0) {
      cooldownTimerEl.textContent = `⏳ Mandatory cool-off: ${cooldownSeconds}s remaining`;
    } else {
      clearInterval(cooldownInterval);
      cooldownTimerEl.textContent = "⏱️ Timer complete. Finish typing the sentence!";
      checkPenaltyFulfilled();
    }
  }, 1000);
});

document.getElementById("cancelBypassBtn").addEventListener("click", () => {
  modal.style.display = "none";
  clearInterval(cooldownInterval);
});

penaltyInputEl.addEventListener("input", checkPenaltyFulfilled);

function checkPenaltyFulfilled() {
  const typed = penaltyInputEl.value.trim();
  const isMatch = typed.toLowerCase() === currentPenalty.trim().toLowerCase();
  const isTimerDone = cooldownSeconds <= 0;

  if (isMatch && isTimerDone) {
    confirmBypassBtn.disabled = false;
    confirmBypassBtn.classList.add("enabled");
    confirmBypassBtn.textContent = "Unlock 5-Min Pass (Walk of Shame)";
  } else if (!isTimerDone) {
    confirmBypassBtn.disabled = true;
    confirmBypassBtn.classList.remove("enabled");
  } else {
    confirmBypassBtn.disabled = true;
    confirmBypassBtn.classList.remove("enabled");
    confirmBypassBtn.textContent = "Type exact sentence to unlock";
  }
}

confirmBypassBtn.addEventListener("click", () => {
  if (confirmBypassBtn.disabled) return;

  chrome.runtime.sendMessage({
    type: "REQUEST_BYPASS",
    durationMinutes: 5
  }, () => {
    modal.style.display = "none";
    // Navigate user to the intended site
    if (blockedSite && blockedSite !== "Distraction") {
      window.location.href = `https://${blockedSite}`;
    } else {
      window.history.back();
    }
  });
});

// Initialization
loadRoast();
updateStatsUI();
recordVisit();