// Get the html source of the page
var src = new XMLSerializer().serializeToString(document);

// url of validator
// url = 'https://html5.validator.nu';
// url = 'https://checker.html5.org';
url = 'http://validator.w3.org/nu/'; // W3C have probably better servers

// Create a blob with the html source of the page
var blob = new Blob([src], { type: "text/html; charset=UTF-8", ending:"transparent"});

// formData to submit
data = new FormData();
data.append("file", blob);
data.append("docselect", "file");
data.append("showsource", "yes");

var message;


// Ajax request for submitting the form and getting response
$.ajax({
  url: url,
  type: 'POST',
  crossDomain: true,
  contentType: false,
  cache: false,
  processData: false,
  data: data,
  //called when successful
  success: function(pageData, textStatus, xhr) {
    resultPage = $(pageData);

    results = $(resultPage).filter("div#results"); // select the div with results

    var result = results.find("p.success, p.failure") // select one of sucess or failure class
    // if it's sucess, we have valid HTML5
    if ($(result).hasClass("success")) {
      message = {
        status: "valid",
      };

    // else if it's failure, we have invalid HTML5
    } else if ($(result).hasClass("failure")) {
      var warningCnt = results.find("li.warning").length;
      var errorsCnt  = results.find("li.error").length;
      var resultsDetails = results.html();
      message = {
        status: "invalid",
        warnings: warningCnt,
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

    // send the result to addon
    self.port.emit("check-response", message);
  },

  //called when there is an ajax error
  error: function(xhr, textStatus, errorThrown) {
    message = {
      status: "error",
      details: "unable to make ajax request",
    };    
    self.port.emit("check-response", message);
  }
  
});
