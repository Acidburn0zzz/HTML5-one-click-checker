// wait for response and append it to div#result
self.port.on("details", function (details) {
  results = document.getElementById("results");
  var ol = document.createElement("ol");
  ol.innerHTML = ol.innerHTML + details;
  results.appendChild(ol);
});