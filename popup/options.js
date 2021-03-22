(function () {
  const DEFAULT_PREFIX = 'SCALRCORE-'
  const DEFAULT_BASE_URL = 'https://scalr-labs.atlassian.net/browse/'
  const DEFAULT_PR_ONLY = false

  function initInputs () {
    const gettingStoredSettings = browser.storage.local.get()

    function updateValues (restoredSettings) {
      document.getElementById('base-url').value = restoredSettings.baseUrl || DEFAULT_BASE_URL
      document.getElementById('jira-prefix').value = restoredSettings.jiraPrefix || DEFAULT_PREFIX
    }

    function handleError (error) {
      console.log(error)
      document.getElementById('base-url').value = DEFAULT_BASE_URL
      document.getElementById('jira-prefix').value = DEFAULT_PREFIX
      document.getElementById('pr-only').checked = DEFAULT_PR_ONLY
    }
    gettingStoredSettings.then(updateValues, handleError)
  }

  function listenForClicks () {
    document.addEventListener('click', (e) => {
      function reset () {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          browser.tabs.sendMessage(tabs[0].id, {
            action: 'reset'
          })
        })
      }

      function saveAndRedraw (jiraPrefix, baseUrl) {
        browser.storage.local.set({ jiraPrefix: jiraPrefix })
        browser.storage.local.set({ baseUrl: baseUrl })

        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          browser.tabs.sendMessage(tabs[0].id, {
            action: 'highlight',
            baseUrl: baseUrl,
            jiraPrefix: jiraPrefix,
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
