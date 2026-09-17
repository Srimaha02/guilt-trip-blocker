const messages = [
  { emoji: "🫵", text: "Dei. Padikka mudiyala nu illa. Nee padikka virumbala. Difference purinjiko." },

  { emoji: "▶️", text: "YouTube-la oru video paakalam nu vandha? Unakku theriyum adhu oru video-la stop aagadhu." },

  { emoji: "💀", text: "\"One video only\" nu sonna nee dhaana? YouTube-ku un history vera story solludhu." },

  { emoji: "😂", text: "Study video paaka vandhu, recommendation-la 17 videos later... enna da research?" },

  { emoji: "📱", text: "YouTube open panna 0.2 seconds. DSA open panna loading screen. Semma priorities." },

  { emoji: "🫠", text: "Nee tired illa da. Distracted. Rendu perukkum difference irukku." },

  { emoji: "📌", text: "Pinterest-la inspiration thedura? Inspiration kidaichiduchu. Ippo actual work pannalama?" },

  { emoji: "😭", text: "\"Just getting some ideas\" nu Pinterest-la 1 hour. Idea vandhucha? Illa board mattum perusa aacha?" },

  { emoji: "🤡", text: "Pinterest board aesthetic ah irukku. Un actual progress enga da?" },

  { emoji: "👀", text: "One more pin save pannina life change aaguma? Illa one task finish pannina change aaguma?" },

  { emoji: "😤", text: "Un potential-ku problem illa. Un \"later\" dhaan full-time villain." },

  { emoji: "⏳", text: "Time unakku wait panna maatadhu. Nee dhaan time-a waste pannitu irukka." },

  { emoji: "🗿", text: "Motivation video 20 mins paatha motivation varala. Work start panna dhaan varum." },

  { emoji: "🔥", text: "YouTube recommendation un future plan illa da. Un task list dhaan." },

  { emoji: "😐", text: "Padikka vandha screen-la YouTube. YouTube-la pona recommendation. Recommendation-la pona... goodbye." },

  { emoji: "🎬", text: "Interval mudinjiduchu da. Second half-la konjam serious-aa iru." },

  { emoji: "💥", text: "One video. One pin. One more. Ippadi dhaan one hour disappear aagudhu." },

  { emoji: "🫵", text: "Nee busy illa. Nee distracted. Konjam brutal-a irukkum, but true." },

  { emoji: "📚", text: "Oru topic. Oru problem. Oru small win. Adhula start pannu." },

  { emoji: "😮‍💨", text: "Mood varattum nu wait pannadha. Work pannina dhaan mood varum." },

  { emoji: "😂", text: "Unakku inspiration overload. Execution konjam shortage." },

  { emoji: "🧠", text: "Pinterest-la future room save pannita. Ippo future career-ku konjam work pannu." },

  { emoji: "🚫", text: "Not now da. Un attention-ku vera velai irukku." },

  { emoji: "⚡", text: "Future build panna poriya? Illa recommendation feed build panna poriya?" },

  { emoji: "🥲", text: "Innaiku skip pannina easy. Naalaiku regret panna romba easy." },

  { emoji: "👀", text: "Un future self un mela depend aagitu irukku. Nee inga thumbnails paathutu irukka." },

  { emoji: "🫡", text: "Screen close. Brain open. Work start." },

  { emoji: "💀", text: "One more video nu sollitu semester mudinjidum da. Konjam control." },

  { emoji: "🎯", text: "Scroll panna target illa. Study panna target irukku. Target-a paaru." },

  { emoji: "🏃", text: "Vaa da. Escape illa. Work-ku thirumbi po." }
];

function loadRandomMessage() {
  const random = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById("emoji").textContent = random.emoji;
  document.getElementById("message").textContent = random.text;
}

async function loadStreak() {
  const data = await chrome.storage.local.get(["streakToday", "lastBlockDate"]);
  const today = new Date().toDateString();
  const streak = data.lastBlockDate === today ? (data.streakToday ?? 0) : 0;

  document.getElementById("streak").textContent =
    streak > 0 ? `You resisted ${streak} time(s) today 🔥` : "";
}

function notifyBlockedVisit() {
  chrome.runtime.sendMessage({ type: "BLOCKED_VISIT" });
}

document.getElementById("backBtn").addEventListener("click", () => {
  window.history.back();
});

loadRandomMessage();
loadStreak();
notifyBlockedVisit();

// refresh streak count shortly after notifying background (async update)
setTimeout(loadStreak, 500);