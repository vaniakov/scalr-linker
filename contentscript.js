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

  function loadAndHighlight () {
    // using browser extension storage for loading popup values
    const gettingStoredSettings = browser.storage.local.get()
    gettingStoredSettings.then(restoredSettings => {
      higlight(restoredSettings.jiraPrefix || DEFAULT_PREFIX, restoredSettings.baseUrl || DEFAULT_BASE_URL)
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
  function higlight (jiraPrefix, baseUrl) {
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
    let targetContainer = document.getElementsByTagName('body')
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
    }
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'highlight') {
      reset()
      higlight(message.jiraPrefix, message.baseUrl)
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
