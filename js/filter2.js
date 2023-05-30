var xpathPatterns = [];

chrome.storage.sync.get({
  blacklist: 'FBFilter'
}, function(items) {
  var sourceCodeKeywords = ['Trump', 'trump', 'TRUMP']; // Function to extract keywords from the source code
  var userKeywords = items.blacklist.toLowerCase().split(/\r?\n/);

  // Merge source code keywords and user keywords
  var allKeywords = sourceCodeKeywords.concat(userKeywords);

  for (var i = 0; i < allKeywords.length; i++) {
    var word = allKeywords[i];
    xpathPatterns.push(
      ["//body//*[not(self::script or self::style)]/text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + word + "')]", word],
      ["//body//a[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word],
      ["//body//img[contains(translate(@src, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word],
      ["//body//img[contains(translate(@alt, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'" + word + "')]", word]
    );
  }

  filterNodes();
  observeNodes();
});

function filterNodes() {
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
      // actually we allow for variations like "_word_" "words" or "_words"
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
}

function showPrompt(node) {
  // Create and style the prompt overlay and container
  var overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.zIndex = "9999";

  var promptContainer = document.createElement("div");
  promptContainer.style.position = "absolute";
  promptContainer.style.top = "50%";
  promptContainer.style.left = "50%";
  promptContainer.style.transform = "translate(-50%, -50%)";
  promptContainer.style.backgroundColor = "white";
  promptContainer.style.padding = "20px";
  promptContainer.style.borderRadius = "5px";
  promptContainer.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
  promptContainer.style.textAlign = "center";

  var promptText = document.createElement("p");
  promptText.textContent = "Do you want to filter this keyword?";
  promptText.style.marginBottom = "10px";

  var yesButton = document.createElement("button");
  yesButton.textContent = "Yes";
  yesButton.style.marginRight = "10px";

  var noButton = document.createElement("button");
  noButton.textContent = "No";

  // Append elements to the prompt container
  promptContainer.appendChild(promptText);
  promptContainer.appendChild(yesButton);
  promptContainer.appendChild(noButton);

  // Append prompt container to the overlay
  overlay.appendChild(promptContainer);

  // Append overlay to the body
  document.body.appendChild(overlay);

  // Event listeners for button clicks
  yesButton.addEventListener("click", function() {
    // Perform the filtering logic for the specific keyword
    var keyword = node.dataset.keyword;
    var regex = new RegExp("(\\b|_)(" + keyword + ")(\\b|_|s)", "i");
    var parent = node.parentNode;
    if (regex.test(node.data) && parent !== null) {
      parent.removeChild(node);
    }

    // Remove the overlay
    document.body.removeChild(overlay);
  });

  noButton.addEventListener("click", function() {
    // Remove the overlay
    document.body.removeChild(overlay);
  });
}

function observeNodes() {
  var nodes = document.querySelectorAll("body *");
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var nodeText = node.textContent.trim();
    if (nodeText !== "") {
      for (var j = 0; j < xpathPatterns.length; j++) {
        var regex = new RegExp(
          "(\\b|_)(" + xpathPatterns[j][1] + ")(\\b|_|s)",
          "i"
        );
        if (regex.test(nodeText)) {
          node.dataset.keyword = xpathPatterns[j][1];
          showPrompt(node);
          break;
        }
      }
    }
  }
}

setTimeout(filterNodes, 1000);
setInterval(filterNodes, 2000);
