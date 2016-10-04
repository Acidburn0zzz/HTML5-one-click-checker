// We require chrome for sanitizing the HTML we got from the HTML5 validator
const {Cc, Ci} = require("chrome");
var parser = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);

var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var Request = require("sdk/request").Request;

// Default properties of the button
var button = ToggleButton({
  id: "HTML5-one-click-checker",
  label: "Check HTML5",
  icon: {
    "16": "./html5-16.png",
    "32": "./html5-32.png",
    "64": "./html5-64.png"
  },
  onChange: handleChange,
});

// Default properties of the panel
var panel = panels.Panel({
  width: 600,
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("get-text.js"),
  contentStyleFile: self.data.url("style.css"),
  onHide: handleHide
});


// This event is called everytimes a page is loaded in the tab.
// It permit to reinit the button when a page is loaded and ready
tabs.on('ready', function(tab){
  button.state("window", {checked: false,})
  button.state("tab", {
    badge: null,
    badgeColor: null,
  })
  button.once("click", checkHTML);
});


function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });    
  }
}

// Check the HTML and wait for response for processing
function checkHTML() {
  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url("check.js")
  });
  // When source is receveid we ask for doing the request to validator
  worker.port.on("source", function(src) {
    worker.port.emit("do-request");
  });

  // when response is receveid from validator, we sanitize the HTML ank to convert to DOM document (for easy parsing)
  worker.port.on("do-sanitizeHTML", function(responseText) {
    var sanitized = parser.sanitize(responseText, parser.SanitizerAllowStyle);
    worker.port.emit("do-convertToDOM", sanitized);
  });


  // We wait for a response 
  worker.port.on("check-response", function(response) {
    if (response.status == "error") {
      button.state("tab", {
        badgeColor: "black",
        badge: "Err",
      });
      // log the error message to console
      console.log(response.details);

    } else if (response.status == "invalid") {
      button.state("tab", {
        badgeColor: "red",
        badge: response.warnings+response.errors,
      });
      // send validation details to panel
      panel.port.emit("details", response.details);

    } else if (response.status == "valid"){
      button.state("tab", {
        badgeColor: "green",
        badge: "ok",
      });

    } else {
      button.state("tab", {
        badgeColor: "black",
        badge: "Err",
      });
      // log the error message to console
      console.log("Unexpected error!")
    }

  });

}

// Remove the global checked state when the panel is hiding
function handleHide() {
  button.state('window', {checked: false});
}