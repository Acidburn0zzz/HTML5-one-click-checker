// select the div#results of the panel
var results = $("#results");

// wait for response and append it to div#result
self.port.on("details", function (details) {
  $(results).html(details);
});