// listen for tabs url change and send corresponding event to the content script

function onError(error) {
  console.debug(`Error: ${error}`);
}


const URLS = ['github.com', 'drone.scalr-labs.net']
URLS.forEach(function(url) {
    browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      const url = new URL(tab.url)
      if (changeInfo.title || url.hostname === url) {
        console.debug(changeInfo);
        console.debug("Tab updated.");
        browser.tabs.sendMessage(tabId, {
          event: 'tabUpdated'
        }).catch(onError);
      }
    }
    )
  }
)
