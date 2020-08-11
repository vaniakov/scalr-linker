(function () {
  const DEFAULT_PREFIX = 'SCALRCORE-'
  const DEFAULT_BASE_URL = 'https://scalr-labs.atlassian.net/browse/'

  function initInputs () {

    function updateValues (restoredSettings) {
      document.getElementById('base-url').value = restoredSettings.baseUrl || DEFAULT_BASE_URL
      document.getElementById('jira-prefix').value = restoredSettings.jiraPrefix || DEFAULT_PREFIX
    }

    function handleError (error) {
      console.log(error)
      document.getElementById('base-url').value = DEFAULT_BASE_URL
      document.getElementById('jira-prefix').value = DEFAULT_PREFIX
    }
    const gettingStoredSettings = chrome.storage.local.get()
    gettingStoredSettings.then(updateValues, handleError)
  }

  function listenForClicks () {
    document.addEventListener('click', (e) => {
      function reset () {
        chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'reset'
          })
        })
      }

      function saveAndRedraw (jiraPrefix, baseUrl) {
        chrome.storage.local.set({ jiraPrefix: jiraPrefix })
        chrome.storage.local.set({ baseUrl: baseUrl })

        chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'highlight',
            baseUrl: baseUrl,
            jiraPrefix: jiraPrefix
          })
        }, error => console.log(error))
      }

      if (e.target.classList.contains('save')) {
        const baseUrl = document.getElementById('base-url').value
        const jiraPrefix = document.getElementById('jira-prefix').value
        saveAndRedraw(jiraPrefix, baseUrl)
      } else if (e.target.classList.contains('reset')) {
        reset()
      }
    })
  };

  initInputs()
  listenForClicks()
})()
