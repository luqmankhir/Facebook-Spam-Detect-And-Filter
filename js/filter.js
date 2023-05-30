/*
 * FacebookSpam - Content Script
 *
 * This is the primary JS file that manages the detection and filtration of words from the web page.
 */

var xpathPatterns = [];

//Empty array to stop scanning when user click cancel to spam keywords that they don't want to scan
var filteredKeywords = [];


chrome.storage.sync.get({
    blacklist: 'FBFilter'
}, function(items) {
    
    var sourceCodeKeywords = ['Trump', 'trump', 'TRUMP'];
    badWords = items.blacklist.toLowerCase().split(/\r?\n/);
    var keywords = badWords.concat(sourceCodeKeywords);

    for(var i = 0; i < keywords.length; i++) {

        
        var word = keywords[i];
        xpathPatterns.push(
            ["//body//*[not(self::script or self::style)]/text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + word + "')]", word],
            ["//body//a[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word],
            ["//body//img[contains(translate(@src, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word],
            ["//body//img[contains(translate(@alt, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word]        );
    }
});


function confirmFilterKeyword(keyword) {
    return confirm("Do you want to block the keywords: " + keyword + "?");
  }



//Instantly block the word\
/*
  function filterNodes() {
    var array = new Array();
    for (i = 0; i < xpathPatterns.length; i++) {
        var xpathResult =
            document.evaluate(xpathPatterns[i][0],
                document, null,
                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        var thisNode = xpathResult.iterateNext();
        while (thisNode) {
            // only when we have a match for the whole word add the node to the array
            // actually we allow for variations like "_word_" "words" or "_words"
            var regex = new RegExp("(\\b|_)(" + xpathPatterns[i][1] + ")(\\b|_|s)", "i");
            if(regex.test(thisNode.data)) {
                array.push(thisNode);
            }
            thisNode = xpathResult.iterateNext();
        }
    }


    //deletedCount = deletedCount + array.length;
    for (var i = 0; i < array.length; i++) {
        var p = array[i].parentNode;
        if (p !== null)
            p.removeChild(array[i]);
    }
}
*/


//Prompt error before block the spam keywords
/*
    1) There's an issue where user will always need to prompt 'OK' on every each of keywords that had been detected
    2) Everytime user click cancel and continue scrolling the web page, the prompt message will popup back
        whether i would like to continue block the keyword that i just click Cancel.
    3) Hovering issue everytime I hover to something, the web page will regenerate and return scanning the whole page
        back    
*/
/*
function filterNodes() {
    var filteredNodes = [];
  
    for (i = 0; i < xpathPatterns.length; i++) {
      var xpathResult = document.evaluate(xpathPatterns[i][0], document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
      var thisNode = xpathResult.iterateNext();
      
      while (thisNode) {
        var regex = new RegExp("(\\b|_)(" + xpathPatterns[i][1] + ")(\\b|_|s)", "i");
        if (regex.test(thisNode.data)) {
          filteredNodes.push({ node: thisNode, keyword: xpathPatterns[i][1] });
        }
        thisNode = xpathResult.iterateNext();
      }
    }
  
    for (var i = 0; i < filteredNodes.length; i++) {
      var node = filteredNodes[i].node;
      var keyword = filteredNodes[i].keyword;
      
      if (confirmFilterKeyword(keyword)) {
        var p = node.parentNode;
        if (p !== null)
          p.removeChild(node);
      }
    }
  }
  


window.addEventListener("load", function() {
    filterNodes()
});
*/

//Prompt error before block the spam keywords
var isFiltering = false;

function filterNodes() {
    // Set the flag to indicate that filtering is in progress
    isFiltering = true;
  
    var array = new Array();
    for (i = 0; i < xpathPatterns.length; i++) {
      var xpathResult = document.evaluate(
        xpathPatterns[i][0],
        document,
        null,
        XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
        null
      );
      var thisNode = xpathResult.iterateNext();
      while (thisNode) {
        // only when we have a match for the whole word add the node to the array
        // actually, we allow for variations like "_word_" "words" or "_words"
        var regex = new RegExp(
          "(\\b|_)(" + xpathPatterns[i][1] + ")(\\b|_|s)",
          "i"
        );
        if (regex.test(thisNode.data)) {
          array.push(thisNode);
        }
        thisNode = xpathResult.iterateNext();
      }
    }
  
    for (var i = 0; i < array.length; i++) {
      var p = array[i].parentNode;
      if (p !== null) p.removeChild(array[i]);
    }
  
    // Set the flag to indicate that filtering is complete
    isFiltering = false;
  }
 
  



/*setTimeout(filterNodes, 1000);
setInterval(filterNodes, 2000);

window.addEventListener("scroll", function() {
    filterNodes()
});
*/



// Initialize a flag to track if filtering is already in progress
var isFiltering = false;

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