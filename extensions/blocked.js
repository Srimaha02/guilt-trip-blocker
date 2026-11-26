const KOLLYWOOD_ROASTS = [
  {
    actor: "🎭 Vadivelu • Shock",
    gif: "https://media.tenor.com/726tO49dM_IAAAAM/vadivelu-shocked.gif",
    emoji: "😱",
    text: "\"Aahaan! Padikkanum nu laptop open pannitu, Instagram-la enna da aaraichi?\""
  },
  {
    actor: "🎭 Vadivelu • Enna Koduma",
    gif: "https://media.tenor.com/1s22-L6B5M0AAAAM/vadivelu-comedy.gif",
    emoji: "🤦‍♂️",
    text: "\"Enna koduma sir idhu! 'One reel only' nu solli 45 mins-aa scroll pannitu irukka!\""
  },
  {
    actor: "🎭 Santhanam • Counter",
    gif: "https://media.tenor.com/k9r1R52x3g4AAAAM/santhanam-tamil.gif",
    emoji: "😏",
    text: "\"Un dream company Google-ah? Illa YouTube Shorts watch history-la world record-ah?\""
  },
  {
    actor: "🔥 Superstar Rajini • Warning",
    gif: "https://media.tenor.com/4n_r4p7P56EAAAAM/rajinikanth-cool.gif",
    emoji: "🕶️",
    text: "\"Kanna, oru thadava distract aana nooru thadava regret pannuva. Close the tab!\""
  },
  {
    actor: "🔥 Thalapathy Vijay • Focus",
    gif: "https://media.tenor.com/2Q8R8Y4a3e4AAAAM/vijay-thalapathy.gif",
    emoji: "⚡",
    text: "\"All is well nu sollitu syllabus-a mudikama reel paatha placement varadhu bro!\""
  },
  {
    actor: "🎭 Goundamani • Reality Check",
    gif: "https://media.tenor.com/o5H3kS4n_2wAAAAM/goundamani-tamil.gif",
    emoji: "🙄",
    text: "\"Arasiyal-la idhellam saadharanamappa... aana exam hall-la indha reels kaapathadhu!\""
  }
];

const PENALTY_SENTENCES = [
  "Naan self-control illadha aalu, en future-a vida reels dhaan mukkiyam.",
  "I admit I am weak against algorithms and choosing instant dopamine over hard work.",
  "Naan focus panna mudiyama surrender panniten, give me 5 minutes walk of shame."
];

const CS_QUIZ_BANK = [
  { q: "What is the worst-case time complexity of QuickSort?", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], ans: 1 },
  { q: "Which data structure is used for Breadth-First Search (BFS)?", options: ["Stack", "Priority Queue", "Queue", "Disjoint Set"], ans: 2 },
  { q: "In Java, which map guarantees O(1) lookup and preserves insertion order?", options: ["HashMap", "TreeMap", "LinkedHashMap", "ConcurrentHashMap"], ans: 2 },
  { q: "Which SQL isolation level prevents dirty & non-repeatable reads but allows phantom reads?", options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"], ans: 2 }
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
    gain.gain.setValueAtTime(0.16, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

async function loadRoast() {
  const data = await chrome.storage.local.get(["customRoasts", "soundEnabled"]);
  if (data.soundEnabled !== false) playBlockSound();

  let pool = [...KOLLYWOOD_ROASTS];
  if (Array.isArray(data.customRoasts)) {
    data.customRoasts.forEach((r) => {
      pool.push({
        actor: "🎬 Custom Kollywood Roast",
        gif: KOLLYWOOD_ROASTS[Math.floor(Math.random() * KOLLYWOOD_ROASTS.length)].gif,
        emoji: "🔥",
        text: `"${r}"`
      });
    });
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById("actorBadge").textContent = pick.actor;
  document.getElementById("roastText").textContent = pick.text;
  document.getElementById("siteBadge").textContent = `🚫 Blocked: ${blockedSite}`;

  const stage = document.getElementById("gifStage");
  stage.innerHTML = `<img src="${pick.gif}" alt="${pick.actor}" onerror="this.parentElement.innerHTML='<div class=\\'gif-fallback\\'>${pick.emoji}<span style=\\'font-size:12px;color:#94a3b8;margin-top:8px;\\'>${pick.actor}</span></div>'" />`;
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
  if (blockedSite && blockedSite !== "Distraction") window.location.href = `https://${blockedSite}`;
  else window.history.back();
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
        document.getElementById("quizFeedback").textContent = "❌ Wrong answer! Try again or go back to studying.";
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
    if (cooldownSeconds > 0) cooldownTimerEl.textContent = `⏳ Mandatory cool-off: ${cooldownSeconds}s remaining`;
    else {
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
  confirmBypassBtn.disabled = !(match && cooldownSeconds <= 0);
  confirmBypassBtn.style.opacity = confirmBypassBtn.disabled ? "0.4" : "1";
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