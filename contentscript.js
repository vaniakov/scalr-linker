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
  const DEFAULT_SELECTOR = 'span.base-ref, span.commit-ref, div.description > span.to > a.repo-item-label'

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

  function findUpTag(el, tag) {
      while (el.parentNode) {
          el = el.parentNode;
          if (el.tagName.toLowerCase() === tag.toLowerCase())
              return el;
      }
      return null;
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
    var selector = DEFAULT_SELECTOR

    let targetContainer = document.querySelectorAll(selector)

    reset()

    if (targetContainer.length !== 0) {
      targetContainer.forEach(function(container) {
          let textNodes = searchTextNodesUnder(container)
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

                // try not to create link inside of other link
                let parentLink = findUpTag(textNode, "a")
                if (parentLink) {
                    insertLink(parentLink, targetWord, index)
                }
                else
                {
                  insertLink(textNode, targetWord, index)
                }
              }
            }
          })
        }
      )
    } else {
      console.debug('No elements for selector: ' + selector)
      setTimeout(loadAndHighlight, 1000);
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
        reset()
        loadAndHighlight()
      }
    })
})()
