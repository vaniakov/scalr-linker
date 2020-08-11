// listen for tabs url change and send corresponding event to the content script
const GITHUB_URL = 'github.com'
chrome.tabs.onUpdated.addListener(function
(tabId, changeInfo, tab) {
  const url = new URL(tab.url)
  if (changeInfo.title && url.hostname === GITHUB_URL) {
    chrome.tabs.sendMessage(tabId, {
      event: 'tabUpdated'
    })
  }
}
)
