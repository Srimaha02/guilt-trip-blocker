const messages = [
  { emoji: "😤", text: "Padikka poyi Insta scroll pannuriya? Amma paathaa enna solluva?" },
  { emoji: "📚", text: "Placement season da... idhellam pathaadhu, semester marks paaru!" },
  { emoji: "😮‍💨", text: "5 mins nu solli 1 hour scroll pannuvennu enakku theriyum." },
  { emoji: "🥲", text: "Un friends ellam prep pannitu irukanga, nee ithu paakura." },
  { emoji: "🫵", text: "Idha vida oru DSA problem solve pannirundha nalla irukumla?" },
  { emoji: "😬", text: "GATE exam close aaguthu da... phone kelambu." },
  { emoji: "🙄", text: "Ivlo naal 'kadaisi naal padikaren' nu solradhu epdi work aayiduchu?" },
  { emoji: "😩", text: "Reels paatha un future change aaiduma? Illa dhaane." },
  { emoji: "🫠", text: "Study hours nu unnaale set pannitu, unnaale break pannura." },
  { emoji: "😑", text: "Vera edhavadhu pannu... idha thavira." },
  { emoji: "🥴", text: "Resume-la 'good time management' nu potrukka... idha paaru." },
  { emoji: "😮", text: "Naalaikku interview irundha, indha 10 mins waste panna aagadhu." },
  { emoji: "🫤", text: "Ithellam pathutu 'naan busy' nu solradha nிறுத்து." },
  { emoji: "😪", text: "Concentration konjam dhaan irukku, adha waste pannadha." },
  { emoji: "🙃", text: "Idhu block aagi irukku... adhukkaga dhaan da, nee than block pannitiya." },
  { emoji: "😌", text: "Ippo padikka poinaa, saayangaalam free ah scroll pannalam." },
  { emoji: "😵‍💫", text: "Notification pathu open pannitiya illa vera edhachum? Whatever, mudinjaal padi." },
  { emoji: "🫨", text: "1 topic mudichitu vaa, appuram vaa idha pakalaam." }
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
  window.location.href = "chrome://newtab";
});

loadRandomMessage();
loadStreak();
notifyBlockedVisit();

// refresh streak count shortly after notifying background (async update)
setTimeout(loadStreak, 500);