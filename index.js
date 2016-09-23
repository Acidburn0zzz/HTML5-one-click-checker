var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");

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
  contentScriptFile: [self.data.url("jquery-3.0.0.min.js"), self.data.url("get-text.js")],
  contentStyleFile: self.data.url("style.css"),
  onHide: handleHide
});

// This event is called everytimes a page is loaded in the tab.
// It permit to reinit the button when a page is loaded and ready
tabs.on('ready', function(tab){
  console.log("Button re-initialized");
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
    contentScriptFile: [self.data.url("jquery-3.0.0.min.js"), self.data.url("check.js")]
  });

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