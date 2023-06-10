/*
 * FacebookSpam - Content Script
 *
 * This is the primary JS file that manages the detection and filtration of words from the web page.
 */

var xpathPatterns = [];

// Empty array to stop scanning when user clicks cancel to spam keywords that they don't want to scan
var filteredKeywords = [];

chrome.storage.sync.get({
  blacklist: 'FBFilter'
}, function(items) {

  //var sourceCodeKeywords = ['Trump', 'trump', 'TRUMP'];
  //import dataset of spam keywords from spamkeywords.js
  var script = document.createElement('script');
  script.src = 'spamkeywords.js';
  document.head.appendChild(script);
  
  badWords = items.blacklist.toLowerCase().split(/\r?\n/);
  var keywords = badWords.concat(sourceCodeKeywords);

  for (var i = 0; i < keywords.length; i++) {

    var word = keywords[i];
    xpathPatterns.push(
      ["//body//*[not(self::script or self::style)]/text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + word + "')]", word],
      ["//body//a[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word],
      ["//body//img[contains(translate(@src, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word],
      ["//body//img[contains(translate(@alt, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word]
    );
  }
});

function confirmFilterKeyword(keyword) {
  return confirm("Do you want to block the keywords: " + keyword + "?");
}

var isFiltering = false;
var isPromptShown = false; // Flag to track if prompt has already been shown

function filterNodes() {
  // Set the flag to indicate that filtering is in progress
  isFiltering = true;

  var filteredNodes = [];

  for (var i = 0; i < xpathPatterns.length; i++) {
    var xpathResult = document.evaluate(
      xpathPatterns[i][0],
      document,
      null,
      XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
      null
    );
    var thisNode = xpathResult.iterateNext();

    while (thisNode) {
      var regex = new RegExp("(\\b|_)(" + xpathPatterns[i][1] + ")(\\b|_|s)", "i");
      if (regex.test(thisNode.data)) {
        filteredNodes.push({
          node: thisNode,
          keyword: xpathPatterns[i][1]
        });
      }
      thisNode = xpathResult.iterateNext();
    }
  }

  for (var i = 0; i < filteredNodes.length; i++) {
    var node = filteredNodes[i].node;
    var keyword = filteredNodes[i].keyword;

    if (filteredKeywords.includes(keyword)) {
      continue; // Skip if keyword was previously cancelled
    }

    if (confirmFilterKeyword(keyword)) {
      var p = node.parentNode;
      if (p !== null) {
        p.removeChild(node);
      }
    } else {
      filteredKeywords.push(keyword); // Add keyword to filtered list
    }
  }

  // Set the flag to indicate that filtering is complete
  isFiltering = false;
}

window.addEventListener("load", function() {
  if (!isFiltering) {
    filterNodes();
  }
});

setTimeout(function() {
  if (!isFiltering) {
    filterNodes();
  }
}, 1000);

setInterval(function() {
  if (!isFiltering) {
    filterNodes();
  }
}, 2000);

var scrollTimeout = null;

window.addEventListener("scroll", function() {
  // Check if the filtering is already in progress, if yes, return immediately
  if (isFiltering) {
    return;
  }

  // Set a timeout to delay the filtering process after scrolling stops
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  // Start a new timeout to trigger the filtering after 500 milliseconds of scrolling inactivity
  scrollTimeout = setTimeout(function() {
    filterNodes();
  }, 500);
});

// Alert and prompt for enabling spam filtering if at least one spam keyword is detected
function showFilteringPrompt() {
  alert("Spam keywords detected on the page. Do you want to enable spam filtering?");
  var enableFiltering = confirm("Enable spam filtering?");
  if (enableFiltering) {
    filterNodes();
  }
  isPromptShown = true; // Set the flag to indicate that the prompt has been shown
}

// Check for spam keywords on page load
window.addEventListener("load", function() {
  var hasSpamKeywords = xpathPatterns.some(function(pattern) {
    var xpathResult = document.evaluate(
      pattern[0],
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return xpathResult.singleNodeValue !== null;
  });

  if (hasSpamKeywords && !isPromptShown) { // Show prompt only if not already shown
    showFilteringPrompt();
  }
});
