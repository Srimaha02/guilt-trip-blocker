// Convert 12-hour + AM/PM to 24-hour format
function to24Hour(hour12, ampm) {
  let hour = parseInt(hour12, 10);

  if (ampm === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  return hour;
}


// Convert 24-hour back to 12-hour + AM/PM
function to12Hour(hour24) {
  let ampm = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;

  if (hour12 === 0) hour12 = 12;

  return { hour12, ampm };
}


// Display custom websites
function renderCustomWebsites(customWebsites, blockedWebsites) {
  const list = document.getElementById("customWebsiteList");

  list.innerHTML = "";

  customWebsites.forEach((website) => {

    const row = document.createElement("div");
    row.className = "custom-website";

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "website-checkbox";
    checkbox.value = website;
    checkbox.checked = blockedWebsites.includes(website);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${website}`));


    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-website";
    removeButton.textContent = "Remove";
    removeButton.dataset.website = website;

    row.appendChild(label);
    row.appendChild(removeButton);

    list.appendChild(row);
  });
}


// Load settings
async function loadSettings() {

  const data = await chrome.storage.local.get([
    "startHour",
    "endHour",
    "isEnabled",
    "streakToday",
    "lastBlockDate",
    "blockedWebsites",
    "customWebsites"
  ]);


  const blockedWebsites = data.blockedWebsites ?? [
    "instagram.com",
    "youtube.com",
    "reddit.com",
    "pinterest.com"
  ];

  const customWebsites = data.customWebsites ?? [];


  // Render custom websites
  renderCustomWebsites(customWebsites, blockedWebsites);


  // Check selected websites
  document.querySelectorAll(".website-checkbox").forEach((checkbox) => {
    checkbox.checked = blockedWebsites.includes(checkbox.value);
  });


  // Load study hours
  const startHour24 = data.startHour ?? 9;
  const endHour24 = data.endHour ?? 18;

  const start12 = to12Hour(startHour24);
  const end12 = to12Hour(endHour24);


  document.getElementById("startHour12").value = start12.hour12;
  document.getElementById("startAmPm").value = start12.ampm;

  document.getElementById("endHour12").value = end12.hour12;
  document.getElementById("endAmPm").value = end12.ampm;


  // Load enabled state
  document.getElementById("enabledToggle").checked =
    data.isEnabled ?? true;


  // Load streak
  const today = new Date().toDateString();

  const streak =
    data.lastBlockDate === today
      ? (data.streakToday ?? 0)
      : 0;

  document.getElementById("streakDisplay").textContent =
    streak > 0
      ? `🔥 Resisted ${streak} time(s) today`
      : "No slip-ups yet today 👍";
}


// Save settings
async function saveSettings() {

  const startHour12 =
    document.getElementById("startHour12").value;

  const startAmPm =
    document.getElementById("startAmPm").value;

  const endHour12 =
    document.getElementById("endHour12").value;

  const endAmPm =
    document.getElementById("endAmPm").value;

  const isEnabled =
    document.getElementById("enabledToggle").checked;


  // Get checked websites
  const blockedWebsites =
    Array.from(
      document.querySelectorAll(".website-checkbox:checked")
    ).map((checkbox) => checkbox.value);


  // Validate hours
  if (
    !startHour12 ||
    !endHour12 ||
    startHour12 < 1 ||
    startHour12 > 12 ||
    endHour12 < 1 ||
    endHour12 > 12
  ) {

    document.getElementById("statusMsg").textContent =
      "Enter valid hour (1-12) da.";

    return;
  }


  const startHour =
    to24Hour(startHour12, startAmPm);

  const endHour =
    to24Hour(endHour12, endAmPm);


  if (startHour >= endHour) {

    document.getElementById("statusMsg").textContent =
      "Start time end time-ku munnadi irukanum.";

    return;
  }


  // Get custom websites
  const data =
    await chrome.storage.local.get(["customWebsites"]);

  const customWebsites =
    data.customWebsites ?? [];


  // Save everything
  await chrome.storage.local.set({
    startHour,
    endHour,
    isEnabled,
    blockedWebsites,
    customWebsites
  });


  document.getElementById("statusMsg").textContent =
    "Saved ✅";


  setTimeout(() => {
    document.getElementById("statusMsg").textContent = "";
  }, 1500);
}


// Add custom website
document.getElementById("addWebsiteBtn")
  .addEventListener("click", async () => {

    const input =
      document.getElementById("customWebsite");

    let website =
      input.value.trim().toLowerCase();


    if (!website) {

      document.getElementById("statusMsg").textContent =
        "Website enter pannu da.";

      return;
    }


    // Remove protocol
    website = website
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];


    // Basic domain validation
    if (!website.includes(".")) {

      document.getElementById("statusMsg").textContent =
        "Valid domain kudu da. Example: example.com";

      return;
    }


    const data =
      await chrome.storage.local.get([
        "customWebsites",
        "blockedWebsites"
      ]);


    const customWebsites =
      data.customWebsites ?? [];

    const blockedWebsites =
      data.blockedWebsites ?? [];


    // Prevent duplicates
    if (
      customWebsites.includes(website) ||
      blockedWebsites.includes(website)
    ) {

      document.getElementById("statusMsg").textContent =
        "Already added da 😭";

      return;
    }


    customWebsites.push(website);


    await chrome.storage.local.set({
      customWebsites
    });


    input.value = "";


    renderCustomWebsites(
      customWebsites,
      blockedWebsites
    );


    document.getElementById("statusMsg").textContent =
      "Website added ✅";
  });


// Remove custom website
document.getElementById("customWebsiteList")
  .addEventListener("click", async (event) => {

    if (
      !event.target.classList.contains("remove-website")
    ) {
      return;
    }


    const website =
      event.target.dataset.website;


    const data =
      await chrome.storage.local.get([
        "customWebsites",
        "blockedWebsites"
      ]);


    const customWebsites =
      (data.customWebsites ?? [])
        .filter((item) => item !== website);


    const blockedWebsites =
      (data.blockedWebsites ?? [])
        .filter((item) => item !== website);


    await chrome.storage.local.set({
      customWebsites,
      blockedWebsites
    });


    renderCustomWebsites(
      customWebsites,
      blockedWebsites
    );


    document.getElementById("statusMsg").textContent =
      "Website removed 🗑️";
  });


// Save button
document.getElementById("saveBtn")
  .addEventListener("click", saveSettings);


// Load everything
loadSettings();