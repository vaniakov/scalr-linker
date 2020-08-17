(function () {
  console.debug('Linker extension has been successfully loaded.')

  /* make sure this code runs once */
  if (window.hasRun) {
    return
  }
  window.hasRun = true

  /* in general it's not limited to the github */
  const LINK_CLASS = 'jira-link'

  const DEFAULT_PREFIX = 'SCALRCORE-'
  const DEFAULT_BASE_URL = 'https://scalr-labs.atlassian.net/browse/'
  const DEFAULT_PR_ONLY = true
  const PR_HEADER_SELECTOR = '.js-issue-title'
  const DEFAULT_SELECTOR = 'body'

  function loadAndHighlight () {
    // using browser extension storage for loading popup values
    const gettingStoredSettings = browser.storage.local.get()
    gettingStoredSettings.then(restoredSettings => {
      higlight(restoredSettings.jiraPrefix || DEFAULT_PREFIX, restoredSettings.baseUrl || DEFAULT_BASE_URL, restoredSettings.prOnly || DEFAULT_PR_ONLY)
    }, error => { console.log(error) })
  }
  // remove all created links
  function reset () {
    const links = document.querySelectorAll('.' + LINK_CLASS)
    links.forEach(link => {
      link.remove()
    })
  }

  // Add links to Jira tickets for the found ticket ids
  function higlight (jiraPrefix, baseUrl, prOnly) {
    function searchTextNodesUnder (el) {
      var n; var a = []; var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
      n = walk.nextNode()
      while (n) {
        a.push(n)
        n = walk.nextNode()
      }
      return a
    }

    function insertLink (textNode, targetWord) {
      // Insert a new anchor in front of the word
      const anchor = document.createElement('a')
      anchor.href = baseUrl + targetWord
      anchor.target = '_blank'
      anchor.classList.add(LINK_CLASS)
      textNode.parentNode.insertBefore(anchor, textNode)
    }

    const regex = new RegExp(jiraPrefix + '\\d+', 'i')
    var selector = DEFAULT_SELECTOR
    if (prOnly) {
      selector = PR_HEADER_SELECTOR
    }

    let targetContainer = document.querySelectorAll(selector)

    if (targetContainer.length !== 0) {
      targetContainer = targetContainer[0]
      let textNodes = searchTextNodesUnder(targetContainer)
      textNodes = textNodes.filter(
        node => {
          return node.textContent.includes(jiraPrefix)
        }
      )
      textNodes.forEach(textNode => {
        var matchArray = regex.exec(textNode.textContent)
        if (matchArray === null) {
          console.warn('Regexp ' + regex.source + ' has found nothing.')
          return
        }
        var targetWord = matchArray[0]
        if (targetWord) {
          const index = textNode.nodeValue.indexOf(targetWord)
          if (index !== -1) {
            insertLink(textNode, targetWord, index)
          }
        }
      })
    } else {
      console.debug('No elements for selector: ' + selector)
    }
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'highlight') {
      reset()
      higlight(message.jiraPrefix, message.baseUrl, message.prOnly)
    } else if (message.action === 'reset') {
      reset()
    }
  })

  loadAndHighlight()

  browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      // listen for messages sent from background.js
      if (request.event === 'tabUpdated') {
        loadAndHighlight()
      }
    })
})()
