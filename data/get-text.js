results = document.getElementById("results");

self.port.on("init", function() {
  results.innerHTML="";  
});
// wait for response and append it to div#result
self.port.on("details", function (details) {
  // console.error("Write to panel");
  var ol = document.createElement("ol");
  ol.innerHTML = details;
  results.appendChild(ol);
});