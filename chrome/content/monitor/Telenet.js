/**
 * Class for checking parameter bandwidth use. 
 */ 
function Telenet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "telenet.png"; 
    this.name = "Telenet";
}

Telenet.prototype = new Monitor();

/**
 * Called when we want the meter value to be set or updated.
 * @force If true, we shouldn't use a stored value, but really go look for a new one.   
 */ 
Telenet.prototype.callback = function(/* force? */) {

    /* Set the view in busy state */
  /*  this.state = this.STATE_BUSY;
		this.notify();
     
    /* Prepare to make a SOAP call, prepare parameters. */
    var name = new SOAPParameter();
    name.name = "string";
    name.value = this.username;
    var password = new SOAPParameter();
    password.name = "string0";
    password.value = this.password;
    /* Make an async SOAP call to Telenet. */
    var mySOAPCall = new SOAPCall();
    //mySOAPCall.transportURI = "https://telemeter4tools.telenet.be/TelemeterService";
    mySOAPCall.transportURI = "https://telemeter4tools.services.telenet.be/TelemeterService";
    mySOAPCall.encode(0, "getUsage", "partns", 0, null, 2, new Array(name, password) );
    var returnObject = mySOAPCall.asyncInvoke (this);
}

/**
 * Handles the SOAP response from Telenet. 
 */ 
Telenet.prototype.handleResponse = function(returnObject , call , status , last) {

    if(this.aborted()){
      return;
    }
     
    if(returnObject.fault) {
    
      this.errorMessage = "A SOAP error occured: " + returnObject.fault.faultString;
      this.update(false);
      
    } else {
    
      var responseXml = returnObject.getParameters(false, {})[0].value;
      var parser = new DOMParser();
      var doc = parser.parseFromString(responseXml, "text/xml");
      
      var limits = doc.getElementsByTagName("limits");
      var totals = doc.getElementsByTagName("totalusage");
      
      /* Valid values. */
      if (totals.length != 0) {  
      
        //var limitsUp = limits.item(0).childNodes.item(0).textContent;
        var limitsDown = limits.item(0).childNodes.item(0).textContent;
        
        //var totalsUp = totals.item(0).childNodes.item(0).textContent;
        var totalsDown = totals.item(0).childNodes.item(0).textContent;
      
      	  
        this.usedVolume = ((totalsDown) / 1024).toFixed(1);
        this.totalVolume = parseInt(limitsDown / 1024);
        //this.percentVolume = (this.usedVolume * 100 / this.totalVolume).toFixed(1);
        
        var dateEnd = doc.getElementsByTagName("usage").item(0).getAttribute("day");
        dateEnd = dateEnd.substr(6, 2);
        this.remainingDays = getInterval("nearestOccurence", dateEnd);


        //this.usedUpload = totalsUp / 1024;
        //this.totalUpload = limitsUp / 1024;
        //this.percentUpload = (this.usedUpload * 100 / this.totalUpload).toFixed(1);
        
        //this.status = doc.getElementsByTagName("status").item(0).textContent;
        
      }
      
      /* Service error. */
      else { 
      
        var error = doc.getElementsByTagName("status").item(0).textContent.split(":");
        error[2] = error[2].replace(/\s/g,"");
        
        
        /* Too much requests (more than 2) for the last 60 minutes */
		    if (error[2] == "ERRTLMTLS_00003")
          this.errorMessage = "Expiry time not reached, please check later.";
          
        /* Incorrect Login or Password */
		    else
		     if (error[2] == "ERRTLMTLS_00004")
          this.badLoginOrPass();
        
        /* Another error. */
        else {
          this.errorMessage = "Webservice error : " + error[4];
          consoleDump(error[2] + " " + error[4]);
        }
      }      
    }
    
    /*if (!this.errorMessage) {
      this.extraMessage = "Upload : "+ this.percentUpload +"% ("+ (this.totalUpload - this.usedUpload).toFixed(2) +"GB left).";
    }*/
    
    this.update (!this.errorMessage);
}

