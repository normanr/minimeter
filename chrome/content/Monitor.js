function Monitor(){

	this.listeners = new JArray();
  this.state = this.STATE_DONE;	
  this.errorMessage = '';
	this.extraMessage = '';
	this.remainingDays = null;
	this.amountToPay = '';
	this.remainingAverage = '';
	this.newData = false; // is the new data different from the old one ? (for the animation)
	this.error = "no";
	this.pageContent = null;
  this.trialNumber = 1; // nombre de tentatives (2 tentatives avant prise en compte erreur)

}

Monitor.prototype.STATE_BUSY = 2;
Monitor.prototype.STATE_ERROR = 1;
Monitor.prototype.STATE_DONE = 0;
Monitor.prototype.STATE_ABORT = 3;

Monitor.prototype.check = function(silent) { // override default action
  this.extraMessage = '';
  minimeterprefs.setCharPref("errorExtraMessage", '');
  minimeterprefs.setCharPref("url", '');
  if(silent != "silent")
    this.state = this.STATE_BUSY;
	this.error = "checking";
  minimeterprefs.setCharPref("error", "checking");
  this.notify();
  this.newData = true;
  this.trialNumber = 1;
  this.callback(1);
};


Monitor.prototype.abort = function(){
    this.state = this.STATE_ABORT;
};

Monitor.prototype.getCapacity = function(){
	var capacity;
  try {
    capacity = minimeterprefs.getIntPref('capacity');
    minimeterprefs.setCharPref('capacitychar',capacity);
    minimeterprefs.clearUserPref('capacity');
  }
  catch(e) {}
  
  capacity = minimeterprefs.getCharPref('capacitychar');
  
	return capacity;
};

Monitor.prototype.reportError = function(step, monitor, pageContent, reply) {
  if (this.trialNumber < 2) {
    this.tryAgain(1);
    return;
  }
  if (pageContent !== null) {
    pageContent = decodeURIComponent(pageContent);
    var regServerError = /Service Unavailable|Service Temporarily Unavailable|temporary not avail[ai]ble|en cours de maintenance|currently unavailable|momentanément indisponible/;
    if (regServerError.test(pageContent))
      this.error = "server";
      
    this.cleanPage(encodeURIComponent(pageContent));
    this.pageContent = this.pageContent + "&step="+ step;
  }

  if (this.error == "connection" || this.error == "server") {
    this.setErrorMessageAndPref(this.error, null, true);
    setTimeout("monitor.check('silent');", 60000);
  }
  else {
    if (typeof(reply) == "undefined") { // 1st call of reportError
			var prefService = Components.classes["@mozilla.org/preferences-service;1"]
									 .getService(Components.interfaces.nsIPrefService).getBranch("network.cookie.");
			if (prefService.getIntPref('cookieBehavior') != 0) {
				this.setErrorMessageAndPref("cookies", "extraCookies", true);
			}
			else {
        this.setErrorMessageAndPref("unknown", null, false);
				this.errorPing("failed");
				if (step !== null) {
					var dumpMessage = getString("error.unknownErrorDump").replace("%step", step);
					dumpMessage = dumpMessage.replace("%monitor", monitor);
					consoleDump(dumpMessage);
				}
				var extVersion = this.getExtVersion();
				var module = this.image.substring(0,this.image.indexOf("."));
				http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+"&extversion="+ extVersion +"&status=check", "reportError");
      }
    }
    else { // called from http_post
      reply = decodeURIComponent(reply);
      var regoldversion = /oldversion/;
      if (regoldversion.test(reply)) {
        this.setErrorMessageAndPref("reported", "extraReported", true);
        
        var browserprefs = prefService.getBranch("general.useragent.");
        var locale = browserprefs.getCharPref('locale');
        if (locale == "fr")
          this.url = "http://extensions.geckozone.org/Minimeter";
        else
          this.url = "http://extensions.geckozone.org/Minimeter-en";
        minimeterprefs.setCharPref("url", this.url);
      }
      else {
        var sendDebug = minimeterprefs.getBoolPref('sendDebug');
        this.errorMessage = getString("error.unknown");
        if (!sendDebug) {
          this.extraMessage = getString("error.extraDebug");
          minimeterprefs.setCharPref("errorExtraMessage", "extraDebug");
        }
        
        var regTestDebug = /debug/;
        
        if (regTestDebug.test(reply) && this.pageContent !== null) {
          if (sendDebug) {
            this.pageContent = "&pageContent=" + this.pageContent;
            
            var extVersion = this.getExtVersion();
            var module = this.image.substring(0,this.image.indexOf("."));
            var regLastExtVersion = new RegExp("<lastExtVersion(-"+module+"|)>([0-9.]*)<\/lastExtVersion(-"+module+"|)>", "");
            var lastExtVersion;
            if (regLastExtVersion.test(reply)) {
              lastExtVersion = regLastExtVersion.exec(reply);
              lastExtVersion = lastExtVersion[2];
            }
            if (!this.isVersionLowerThan(extVersion, lastExtVersion)) {
            
              http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+this.pageContent+"&version="+extVersion+"&status=debug", "errorPing");
            }

          }
        }
        this.pageContent = null;
      }
    }
  }
  this.update(false);
};

Monitor.prototype.setFlatRateWithoutInfos = function() {
  this.totalVolume = 0;
  this.usedVolume = 0;
  this.extraMessage = getString("error.extraFlatRate");
  minimeterprefs.setCharPref("errorExtraMessage", "extraFlatRate");
};

Monitor.prototype.isVersionLowerThan = function(versionToCheck, versionRef) {
  var vc =
     Components.classes["@mozilla.org/xpcom/version-comparator;1"].
     getService(Components.interfaces.nsIVersionComparator);
  return (vc.compare(versionToCheck, versionRef) < 0);
};



Monitor.prototype.setErrorMessageAndPref = function(error, extraError, setMessage) {
  this.error = error;
  minimeterprefs.setCharPref("error", error);
  if (setMessage === true)
    this.errorMessage = getString("error."+error);
  
  if (extraError !== null) {
    minimeterprefs.setCharPref("errorExtraMessage", extraError);
    this.extraMessage = getString("error."+extraError);
  }
};

Monitor.prototype.noConnectionLinked = function() {
  this.setErrorMessageAndPref("noConnectionLinked", "noConnectionLinkedExtra", true);

	this.update(false);
};

Monitor.prototype.userActionRequired = function() {
  this.setErrorMessageAndPref("userActionRequired", "userActionRequiredExtra", true);

	this.update(false);
};

Monitor.prototype.badLoginOrPass = function(provider) {
  if(provider=="belgacom")
    this.setErrorMessageAndPref("badLoginOrPass", "badLoginOrPassBg", true);
  else if (provider=="edpnet")
    this.setErrorMessageAndPref("badLoginOrPass", "badLoginOrPassEd", true);
  else
    this.setErrorMessageAndPref("badLoginOrPass", null, true);
    
	this.update(false);
};

Monitor.prototype.getExtVersion = function() {
  var nsIUpdateItem = Components.interfaces.nsIUpdateItem;
  var itemType = nsIUpdateItem.TYPE_EXTENSION;
  var liExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
                .getService(Components.interfaces.nsIExtensionManager);
            
  items = liExtensionManager.getItemList(itemType, { });
  var extVersion;
  for (var i in items) {
    if (items[i].id == "{08ab63e1-c4bc-4fb7-a0b2-55373b596eb7}" ) {
      extVersion = items[i].version;
    }
  }
  
  return extVersion;
};

Monitor.prototype.cleanPage = function(pageContent) {
  pageContent = decodeURIComponent(pageContent);
  var regUsername = new RegExp("" + this.username + "", "gi");
  var regPassword = new RegExp("" + this.password + "", "gi");
  var textToReplace = minimeterprefs.getCharPref('textToReplace');

  pageContent = pageContent.replace(regUsername,"monlogin");
  if(this.password != '' && this.password != ' ')
    pageContent = pageContent.replace(regPassword,"monpassword");
  
  if (textToReplace != "") {
    textToReplace = textToReplace.split(",");
    var toreplace;
    var regToreplace;
    
    for (toreplace in textToReplace) {
      regToreplace = new RegExp("" + toreplace + "", "gi");
      pageContent = pageContent.replace(regToreplace,"replaced");
    }
  }
  this.pageContent = encodeURIComponent(pageContent);
};

Monitor.prototype.errorPing = function(status) {
  var date = new Date().getDate();
  var allowPing = minimeterprefs.getBoolPref('allowPing');
  var lastPing = minimeterprefs.getIntPref('lastPing');

  if (allowPing && date != lastPing) {
		var extVersion = this.getExtVersion();
    minimeterprefs.setIntPref('lastPing', date);
    var module = this.image.substring(0,this.image.indexOf("."));
    
    http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+"&version="+extVersion+"&status="+status, "errorPing");
  }
};

Monitor.prototype.tryAgain = function(step) {
  this.trialNumber++;
  this.callback(step);
};

/*
 * Is called at the end of the transaction
 */ 
Monitor.prototype.update = function(success) {
	
  if(this.state == this.STATE_ABORT){
    return;
  }
          
  if(success){
    this.usedVolume = Math.round(this.usedVolume * 1000)/1000;
    this.totalVolume = Math.round(this.totalVolume * 1000)/1000;
    this.state = this.STATE_DONE;
    if(this.remainingDays != null && (this.totalVolume - this.usedVolume) > 0) {
      var remainingGB = Math.floor((monitor.totalVolume - monitor.usedVolume) / monitor.remainingDays * 1000) /1000;
      var remainingMB = Math.floor((remainingGB - Math.floor(remainingGB)) *1024);
      monitor.remainingAverage = (remainingGB>=1 ? Math.floor(remainingGB) + monitor.measure + " " : "") + remainingMB + monitor.measureMB + " " + getString("info.remainingAverage");
    }
    minimeterprefs.setCharPref("error", "no");
    this.storeCache();
    this.errorPing("success");
  }
  else {
    this.state = this.STATE_ERROR;
    this.clearCache();
  }
  
  this.notify();

};

Monitor.prototype.aborted = function(){
  return (this.state == this.STATE_ABORT);
};

 


Monitor.prototype.addListener = function(listener){
  if(!this.listeners.contains(listener)){
      this.listeners.push(listener);
  }
};

Monitor.prototype.removeListener = function(listener){
  this.listeners.remove(listener);
};
Monitor.prototype.removeAllListeners = function(listener){
  this.listeners = new JArray();
};

Monitor.prototype.notify = function(){
  for(i=0;i<this.listeners.length;i++){
      this.listeners[i].update(this);
  }
};

Monitor.prototype.checkCache = function(calledByTimeout){
  updateTimeout = minimeterprefs.getIntPref('updateTimeout');
  if (updateTimeout < 60) {
    if (updateTimeout == 0)
      updateTimeout = 1;
		updateTimeout = updateTimeout * 3600;
		minimeterprefs.setIntPref('updateTimeout', updateTimeout);
  }
  else
    if (updateTimeout < 300)
      minimeterprefs.setIntPref('updateTimeout', 300);
  if (this.name == "Telenet" && updateTimeout < 1800)
    minimeterprefs.setIntPref('updateTimeout', 1800);
    
  updateTimeout = updateTimeout * 1000;
  var errorpref = minimeterprefs.getCharPref('error');
  if(errorpref != "no") {
    if(calledByTimeout != "error" && errorpref !="badLoginOrPass") {
      minimeterprefs.setCharPref('error','isit');
      setTimeout("monitor.checkCache('error');", 100);
    }
    else {
      if (errorpref != "isit") {
        if (errorpref == "checking")
          this.state = this.STATE_BUSY;
        else {
          this.state = this.STATE_ERROR;
          this.error = errorpref;
          this.errorMessage = getString("error."+this.error);
          errorExtraMessage = minimeterprefs.getCharPref('errorExtraMessage');
          if (errorExtraMessage != '')
            this.extraMessage = getString("error."+errorExtraMessage);
        }
        this.notify();
      }
      else {
        this.check();
        setTimeout("monitor.checkCache(true);", updateTimeout);
      }
    }
  }
  else {
    provider = minimeterprefs.getCharPref('provider');
    cache = minimeterprefs.getCharPref('cache');
    var now = new Date().getTime();
    
    cache = cache.split(";");
  
    if(cache.length >= 5){ // empty cache ?
      // check time
      
      if (cache[0] == provider) {
        var now = new Date().getTime();
        now -= (updateTimeout);
        if(cache[1] > (now + 4000) && cache[1] < (now + 4000 + updateTimeout)) {
          cache[6] = false;
          minimeterprefs.setCharPref('cache', cache.join(";"));
          this.loadCache();
          //consoleDump(now-cache[1]);
          if(!calledByTimeout)
            setTimeout("monitor.checkCache(true);", updateTimeout);
          //this.check();
        }
        else {
          this.check();
          setTimeout("monitor.checkCache(true);", updateTimeout);
          //consoleDump("ok " + (now-cache[1]));
        }
      }
    }
    else {
      this.check();
      setTimeout("monitor.checkCache(true);", updateTimeout);
    }
  }
};

Monitor.prototype.loadCache = function(isNotNewWindow){
  var cache = minimeterprefs.getCharPref('cache');
  cache = cache.split(";");
  this.state = this.STATE_DONE;
  this.usedVolume = cache[2]*1;
  this.totalVolume = cache[3]*1;
  if(cache[4] != '')
    this.remainingDays = cache[4]*1;
//if(cache[5] != '')
  this.extraMessage = cache[5];
//if(cache[7] != '') // 6 is newData
  this.amountToPay = cache[7];
//if(cache[8] != '')
  this.remainingAverage = cache[8];

//this.extraMessage += "(from cache)";
    
  if(isNotNewWindow == true)
    this.checkIfDataIsNew(true);
  else
    this.newData = false;
    
  this.notify();
};

Monitor.prototype.checkIfDataIsNew = function(checkCacheNewData){
  cache = minimeterprefs.getCharPref('cache');
  
  cache = cache.split(";");
  if(!checkCacheNewData)
  {
    if(this.usedVolume != cache[2] || this.totalVolume != cache[3] || this.remainingDays != cache[4])
      this.newData = true;
  }
  else
    this.newData = (cache[6] == "true");
};

Monitor.prototype.storeCache = function(){
  provider = minimeterprefs.getCharPref('provider');
  
  this.checkIfDataIsNew(false);
  
  cache = new Array();
  
  cache[0] = provider;
  cache[1] = new Date().getTime();
  cache[2] = this.usedVolume;
  cache[3] = this.totalVolume;
  cache[4] = this.remainingDays;
  cache[5] = this.extraMessage;
  cache[6] = this.newData;
  cache[7] = this.amountToPay;
  cache[8] = this.remainingAverage;
  
  minimeterprefs.setCharPref('cache', cache.join(";"));
};

Monitor.prototype.clearCache = function(){
  minimeterprefs.setCharPref('cache', '');
};

