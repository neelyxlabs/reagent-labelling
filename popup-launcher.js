document.getElementById('openBtn').addEventListener('click', function() {
  const url = chrome.runtime.getURL('popup.html');
  chrome.tabs.create({ url: url });
  window.close();
});
