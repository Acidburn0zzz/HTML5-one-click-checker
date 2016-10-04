// url of validator
// url = 'https://html5.validator.nu';
// url = 'https://checker.html5.org';
url = 'http://validator.w3.org/nu/'; // W3C have probably better servers

// Get the html source of the page
var src = new XMLSerializer().serializeToString(document);
// send the source code of current tab page to addon
self.port.emit("source", src);


// wait for addon to ask to do the request
self.port.on("do-request", function(){

  // formData to submit
  data = new FormData();
  data.append("content", src);
  data.append("docselect", "textarea");
  data.append("showsource", "no");

  var xhr = new XMLHttpRequest()
  xhr.timeout = 7000; // set the timeout to 7 sec
  xhr.ontimeout = function () {
    console.error("The request for " + url + " timed out.");
  };
  xhr.onerror = function () {
    console.error("Error during the request");
  };  
  xhr.onreadystatechange = function(){
    if(this.readyState === 4) {
      if(this.status === 200) { 
        self.port.emit("do-sanitizeHTML", this.responseText);

      } else {
        console.error('An error occurred during your request: ' +  this.status + ':' + this.statusText);
      } 
    }    
  }
  
  xhr.open("post", url)
  xhr.send(data);
});

var message;

// wait for addon to ask to  convert to DOM... and then do the rest of the check
self.port.on("do-convertToDOM", function(sanitizedHTML){
  var resultDoc = HTMLToDOM(sanitizedHTML);

  // if HTML 5 is valid
  if (resultDoc.querySelector("p.success")) {
    message = {
      status: "valid",
    };

  // else if HTML 5 is invalid
  } else if (resultDoc.querySelector("p.failure")) {
    var results = resultDoc.querySelector("#results ol");
    var warningsCnt = results.querySelectorAll("li.warning").length;
    var errorsCnt = results.querySelectorAll("li.error").length;
    var resultsDetails = results.innerHTML;
    message = {
      status: "invalid",
      warnings: warningsCnt,
      errors: errorsCnt,
      details: resultsDetails,
    };

  // else something is broken
  } else {
    message = {
      status: "error",
      details: "unable to analyse the results",
    };    
  }

  // send the results to addon
  self.port.emit("check-response", message);  
});


function HTMLToDOM(aHTMLString){
  var doc = document.implementation.createHTMLDocument("validator result");
  doc.documentElement.innerHTML = aHTMLString;
  return doc
}



// TODO:
// look for unload/reload panel results when tab switching