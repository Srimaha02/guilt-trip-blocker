// Auto-connects Vercel Dashboard to Chrome Extension without copying Extension ID
window.postMessage({ type: "GTB_EXTENSION_READY", extensionId: chrome.runtime.id }, "*");

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.source !== "GTB_DASHBOARD") return;

  chrome.runtime.sendMessage(event.data.payload, (response) => {
    window.postMessage({
      source: "GTB_EXTENSION",
      requestId: event.data.requestId,
      response
    }, "*");
  });
});