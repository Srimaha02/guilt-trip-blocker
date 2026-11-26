const ROASTS_SAVAGE = [
  { emoji: "🫵", text: "Dei. Padikka mudiyala nu illa. Nee padikka virumbala. Difference purinjiko." },
  { emoji: "▶️", text: "YouTube-la oru video paakalam nu vandha? Unakku theriyum adhu oru video-la stop aagadhu." },
  { emoji: "💀", text: "\"One video only\" nu sonna nee dhaana? History-ku un character vera story solludhu." },
  { emoji: "😂", text: "Study video thedi vandhu, recommendation-la 17 videos later... enna da research?" },
  { emoji: "📱", text: "Social media open panna 0.2 seconds. Problem solve panna loading screen. Semma priorities." },
  { emoji: "🫠", text: "Nee tired illa da. Distracted. Rendu perukkum difference irukku." },
  { emoji: "🤡", text: "Un dream list aesthetic ah irukku. Aana un actual daily progress enga da?" },
  { emoji: "⏳", text: "Time unakku wait panna maatadhu. Nee dhaan time-a waste pannitu irukka." },
  { emoji: "🔥", text: "Recommendation feed build panna poriya? Illa future career build panna poriya?" }
];

const ROASTS_HARDCORE = [
  { emoji: "🪓", text: "Bro, un competitors ippo padichitu irukaanga. Nee inga reel scroll pannitu irukka. All the best." },
  { emoji: "☠️", text: "Placement interview-la poi \"Guilt trip blocker quote semmaya irundhuchu\" nu dhaan solla poriya?" },
  { emoji: "📉", text: "Zero self-control. Zero discipline. Future-la question paper paathu azha ready-aa?" }
];

const ROASTS_GENTLE = [
  { emoji: "🌱", text: "Take a deep breath. A small step right now is better than scrolling for an hour." },
  { emoji: "🎯", text: "Remember why you started. Focus on just 25 minutes of honest work." },
  { emoji: "✨", text: "Progress is made one focused session at a time. You've got this!" }
];

const PENALTY_SENTENCES = [
  "Naan self-control illadha aalu, en future-a vida reels dhaan mukkiyam.",
  "I admit I am weak against algorithms and choosing instant dopamine over hard work.",
  "Naan focus panna mudiyama surrender panniten, give me 5 minutes walk of shame."
];

const CS_QUIZ_BANK = [
  {
    q: "What is the worst-case time complexity of QuickSort?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    ans: 1
  },
  {
    q: "Which data structure is used for Breadth-First Search (BFS) in a graph?",
    options: ["Stack", "Priority Queue", "Queue", "Disjoint Set"],
    ans: 2
  },
  {
    q: "In Java, which collection guarantees O(1) average lookup and preserves insertion order?",
    options: ["HashMap", "TreeMap", "LinkedHashMap", "ConcurrentHashMap"],
    ans: 2
  },
  {
    q: "Which SQL isolation level prevents dirty reads and non-repeatable reads, but still allows phantom reads?",
    options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
    ans: 2
  },
  {
    q: "What is the time complexity of finding the lowest common ancestor in a balanced BST of N nodes?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    ans: 1
  }
];

const urlParams = new URLSearchParams(window.location.search);
const blockedSite = urlParams.get("site") || "Distraction";

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
  } catch (e) {}
}

async function loadRoast() {
  const data = await chrome.storage.local.get(["roastLevel", "customRoasts", "soundEnabled"]);
  if (data.soundEnabled !== false) playBlockSound();

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

  if (Array.isArray(data.customRoasts)) {
    data.customRoasts.forEach((r) => pool.push({ emoji: "👀", text: r }));
  }

  const random = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById("emojiBox").textContent = random.emoji;
  document.getElementById("roastText").textContent = random.text;
  document.getElementById("siteBadge").textContent = `🚫 Blocked: ${blockedSite}`;
}

async function updateStatsUI() {
  const data = await chrome.storage.local.get(["stats"]);
  const stats = data.stats || {};
  const todayCount = stats.todayAttempts || 0;
  const timeSavedMins = todayCount * 15;
  const streakDays = stats.streakDays || 1;

  document.getElementById("statToday").textContent = todayCount;
  document.getElementById("statTimeSaved").textContent =
    timeSavedMins >= 60 ? `${(timeSavedMins / 60).toFixed(1)} hrs` : `${timeSavedMins} mins`;
  document.getElementById("statStreak").textContent = `${streakDays} Day${streakDays > 1 ? "s" : ""}`;
  document.getElementById("streakBadge").textContent =
    todayCount > 0 ? `🔥 Resisted ${todayCount}x Today` : "🛡️ Clean Slate Today";
}

function redirectAfterBypass() {
  if (blockedSite && blockedSite !== "Distraction") {
    window.location.href = `https://${blockedSite}`;
  } else {
    window.history.back();
  }
}

document.getElementById("rerollRoastBtn").addEventListener("click", loadRoast);
document.getElementById("closeTabBtn").addEventListener("click", () => {
  window.close();
  setTimeout(() => { window.location.href = "https://leetcode.com"; }, 150);
});
document.getElementById("btnLeetCode").addEventListener("click", () => window.location.href = "https://leetcode.com");
document.getElementById("btnNeetCode").addEventListener("click", () => window.location.href = "https://neetcode.io");

const earnModal = document.getElementById("earnModal");
document.getElementById("earnScrollBtn").addEventListener("click", () => {
  const item = CS_QUIZ_BANK[Math.floor(Math.random() * CS_QUIZ_BANK.length)];
  document.getElementById("quizQuestion").textContent = item.q;
  document.getElementById("quizFeedback").textContent = "";
  const optsDiv = document.getElementById("quizOptions");
  optsDiv.innerHTML = "";

  item.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${optText}`;
    btn.addEventListener("click", () => {
      if (idx === item.ans) {
        chrome.runtime.sendMessage({ type: "REQUEST_BYPASS", durationMinutes: 10, method: "earned" }, () => {
          earnModal.style.display = "none";
          redirectAfterBypass();
        });
      } else {
        document.getElementById("quizFeedback").textContent = "❌ Wrong answer! Try another question or go back to studying.";
      }
    });
    optsDiv.appendChild(btn);
  });

  earnModal.style.display = "flex";
});
document.getElementById("closeEarnModalBtn").addEventListener("click", () => earnModal.style.display = "none");

const modal = document.getElementById("frictionModal");
const penaltyInputEl = document.getElementById("penaltyInput");
const cooldownTimerEl = document.getElementById("cooldownTimer");
const confirmBypassBtn = document.getElementById("confirmBypassBtn");
let cooldownSeconds = 15;
let cooldownInterval = null;
let currentPenalty = "";

document.getElementById("giveUpLink").addEventListener("click", () => {
  modal.style.display = "flex";
  currentPenalty = PENALTY_SENTENCES[Math.floor(Math.random() * PENALTY_SENTENCES.length)];
  document.getElementById("penaltySentence").textContent = currentPenalty;
  penaltyInputEl.value = "";
  penaltyInputEl.focus();
  cooldownSeconds = 15;
  confirmBypassBtn.disabled = true;
  confirmBypassBtn.style.opacity = "0.4";

  clearInterval(cooldownInterval);
  cooldownTimerEl.textContent = `⏳ Mandatory cool-off: ${cooldownSeconds}s remaining`;
  cooldownInterval = setInterval(() => {
    cooldownSeconds--;
    if (cooldownSeconds > 0) {
      cooldownTimerEl.textContent = `⏳ Mandatory cool-off: ${cooldownSeconds}s remaining`;
    } else {
      clearInterval(cooldownInterval);
      cooldownTimerEl.textContent = "⏱️ Timer complete. Finish typing!";
      checkPenalty();
    }
  }, 1000);
});

document.getElementById("cancelBypassBtn").addEventListener("click", () => {
  modal.style.display = "none";
  clearInterval(cooldownInterval);
});

penaltyInputEl.addEventListener("input", checkPenalty);
function checkPenalty() {
  const match = penaltyInputEl.value.trim().toLowerCase() === currentPenalty.trim().toLowerCase();
  if (match && cooldownSeconds <= 0) {
    confirmBypassBtn.disabled = false;
    confirmBypassBtn.style.opacity = "1";
  } else {
    confirmBypassBtn.disabled = true;
    confirmBypassBtn.style.opacity = "0.4";
  }
}

confirmBypassBtn.addEventListener("click", () => {
  if (confirmBypassBtn.disabled) return;
  chrome.runtime.sendMessage({ type: "REQUEST_BYPASS", durationMinutes: 5, method: "shame" }, () => {
    modal.style.display = "none";
    redirectAfterBypass();
  });
});

loadRoast();
updateStatsUI();
chrome.runtime.sendMessage({ type: "BLOCKED_VISIT", site: blockedSite }, (res) => {
  if (res?.stats) updateStatsUI();
});