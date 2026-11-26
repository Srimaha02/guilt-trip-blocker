// Respond immediately whenever dashboard pings, AND announce on load
function announceReady() {
  window.postMessage({ type: "GTB_EXTENSION_READY", extensionId: chrome.runtime.id }, "*");
}

announceReady();
setTimeout(announceReady, 500);

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.type === "GTB_PING") {
    announceReady();
    return;
  }

  if (event.data.source === "GTB_DASHBOARD") {
    chrome.runtime.sendMessage(event.data.payload, (response) => {
      window.postMessage({
        source: "GTB_EXTENSION",
        requestId: event.data.requestId,
        response
      }, "*");
    });
  }
});