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
Telenet.prototype.check = function(/* force? */) {

    /* Set the view in busy state */
    this.state = this.STATE_BUSY;
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
      
      var limitsUp = limits.item(0).childNodes.item(0).textContent;
      var limitsDown = limits.item(0).childNodes.item(1).textContent;
      
      var totalsUp = totals.item(0).childNodes.item(0).textContent;
      var totalsDown = totals.item(0).childNodes.item(1).textContent;
      
      /* Valid values. */
      if (doc.getElementsByTagName("totalusage").length != 0) {  
      	  
        this.usedVolume = ((totalsDown) / 1024).toFixed(1);
        this.totalVolume = parseInt(limitsDown / 1024);
        this.percentVolume = (this.usedVolume * 100 / this.totalVolume).toFixed(1);

        this.usedUpload = totalsUp / 1024;
        this.totalUpload = limitsUp / 1024;
        this.percentUpload = (this.usedUpload * 100 / this.totalUpload).toFixed(1);
        
        this.status = doc.getElementsByTagName("status").item(0).textContent;
        
        this.storeCache();
      }
      
      /* Service error. */
      else { 
      
        error = doc.getElementsByTagName("status").item(0).textContent.split(":");
        
		    /* Unexpected system error. */
		    if (error[0] == "SYSERR_00001" || error[0] == "ERRTM4TLS_00001")
          this.errorMessage = "Unexpected system error.";
        
        /* Invalid input */
		    else if (error[0] == "ERRTM4TLS_00002")
          this.errorMessage = "Invalid input.";
        
        /* Login does not exist. */
		    else if (error[0] == "ERRTM4TLS_00003")
          this.errorMessage = "Login does not exist.";
        
        /* Login is not active. */
		    else if (error[0] == "ERRTM4TLS_00004")
          this.errorMessage = "Login is not active.";
        
        /* Password incorrect */
		    else if (error[0] == "ERRTM4TLS_00005")
          this.errorMessage = "Password incorrect.";
        
        /* Lime limit reached. */
        else if (error[0] == "ERRTM4TLS_00006") {
          if (!this.loadCache())
            this.errorMessage = "Time limit reached, no cache found (check later)";
        }
        
        /* Another error. */
        else {
        	alert(doc.textContent);
          this.errorMessage = "Webservice error : "+ doc;
        }
      }      
    }
    
    if (!this.errorMessage) {
      this.extraMessage = "Upload : "+ this.percentUpload +"% ("+ (this.totalUpload - this.usedUpload).toFixed(2) +"GB left).";
    }
    
    this.update (!this.errorMessage);
}


Telenet.prototype.loadCache = function(){

    var telenetPrefService = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
                          
    var prefs = telenetPrefService.getBranch("extensions.minimeter.");
    
    try{cache = prefs.getCharPref("telenetCache");}catch(e){
      /* not set yet */
      return false;
    }
    
    cache = cache.split(":");
    if(cache.length == 7){
      this.usedVolume = cache[0];
      this.totalVolume = cache[1];
      this.percentVolume = cache[2];
      this.usedUpload = cache[3];
      this.totalUpload = cache[4];
      this.percentUpload = cache[5];
      this.status = cache[6];
      return true;
    } else {
      return false;
    }
    
}

Telenet.prototype.storeCache = function(){

    var telenetPrefService = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
                          
    var prefs = telenetPrefService.getBranch("extensions.minimeter.");
    var values = this.usedVolume 
      + ":" + this.totalVolume 
      + ":" + this.percentVolume 
      + ":" + this.usedUpload 
      + ":" + this.totalUpload 
      + ":" + this.percentUpload 
      + ":" + this.status;
    prefs.setCharPref("telenetCache", values);
}
