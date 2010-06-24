Minimeter.Monitor = function(){

	this.listeners = new Minimeter.JArray();
  this.state = this.STATE_DONE;	
  this.errorMessage = '';
	this.extraMessage = '';
	this.remainingDays = null;
	this.amountToPay = '';
	this.remainingAverage = '';
	this.newData = false; // is the new data different from the old one ? (for the animation)
	this.error = "no";
	this.errorTimeoutRetry = 60000; // délai entre tentatives après erreur serveur (augmente)
	this.pageContent = null;
  this.trialNumber = 1; // nombre de tentatives (2 tentatives avant prise en compte erreur)
  this.useSIPrefixes = false; // si true, 1 Go = 1000 Mo (et jamais d'affichage de G*i*o)

}

Minimeter.Monitor.prototype.STATE_BUSY = 2;
Minimeter.Monitor.prototype.STATE_ERROR = 1;
Minimeter.Monitor.prototype.STATE_DONE = 0;
Minimeter.Monitor.prototype.STATE_ABORT = 3;

Minimeter.Monitor.prototype.check = function(silent) { // override default action
  this.extraMessage = '';
  Minimeter.prefs.setCharPref("errorExtraMessage", '');
  Minimeter.prefs.setCharPref("url", '');
  if(silent != "silent")
    this.state = this.STATE_BUSY;
	this.error = "checking";
  Minimeter.prefs.setCharPref("error", "checking");
  this.notify();
  this.newData = true;
  this.trialNumber = 1;
  this.callback(1);
};


Minimeter.Monitor.prototype.abort = function(){
    this.state = this.STATE_ABORT;
};

Minimeter.Monitor.prototype.getCapacity = function(){
	var capacity;
  try {
    capacity = Minimeter.prefs.getIntPref('capacity');
    Minimeter.prefs.setCharPref('capacitychar',capacity);
    Minimeter.prefs.clearUserPref('capacity');
  }
  catch(e) {}
  
  capacity = Minimeter.prefs.getCharPref('capacitychar');
  
	return capacity;
};

Minimeter.Monitor.prototype.reportError = function(step, monitor, pageContent, reply) {
  if (this.trialNumber < 2) {
    this.tryAgain(1);
    return;
  }
  if (pageContent !== null) {
    pageContent = decodeURIComponent(pageContent);
    var regServerError = /Service Unavailable|Service Temporarily Unavailable|temporary not avail[ai]ble|temporarily unavailable|en cours de maintenance|currently unavailable|momentanément indisponible/;
    if (regServerError.test(pageContent))
      this.error = "server";
      
    this.cleanPage(encodeURIComponent(pageContent));
    this.pageContent = this.pageContent + "&step="+ step;
  }

  if (this.error == "connection" || this.error == "server") {
    this.setErrorMessageAndPref(this.error, null, true);
    if (this.error == "connection")
      setTimeout("Minimeter.monitor.check('silent');", 60000);
    else
    {
      setTimeout("Minimeter.monitor.check('silent');", this.errorTimeoutRetry);
      this.errorTimeoutRetry = this.errorTimeoutRetry *2; // pour éviter de surcharger le serveur
      var updateTimeout = Minimeter.prefs.getIntPref("updateTimeout") * 1000;
      if (this.errorTimeoutRetry > updateTimeout)
        this.errorTimeoutRetry = updateTimeout;
    }
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
					var dumpMessage = Minimeter.getString("error.unknownErrorDump", "Undefined error on step n°%step in the module %monitor").replace("%step", step);
					dumpMessage = dumpMessage.replace("%monitor", monitor);
					Minimeter.consoleDump(dumpMessage);
				}
				var extVersion = this.getExtVersion();
				var module = this.image.substring(0,this.image.indexOf("."));
				Minimeter.http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+"&extversion="+ extVersion +"&status=check", "reportError");
      }
    }
    else { // called from Minimeter.http_post
      reply = decodeURIComponent(reply);
      var regoldversion = /oldversion/;
      if (regoldversion.test(reply)) {
        this.setErrorMessageAndPref("reported", "extraReported", true);
        
        var prefService = Components.classes["@mozilla.org/preferences-service;1"]
									 .getService(Components.interfaces.nsIPrefService);
        var browserprefs = prefService.getBranch("general.useragent.");
        var locale = browserprefs.getCharPref('locale');
        if (locale == "fr")
          this.url = "http://extensions.geckozone.org/Minimeter";
        else
          this.url = "http://extensions.geckozone.org/Minimeter-en";
        Minimeter.prefs.setCharPref("url", this.url);
      }
      else {
        var sendDebug = Minimeter.prefs.getBoolPref('sendDebug');
        this.errorMessage = Minimeter.getString("error.unknown", "Module error");
        if (!sendDebug) {
          this.extraMessage = Minimeter.getString("error.extraDebug", "You can make it possible to correct the module\nby enabling the corresponding option in Minimeter settings.");
          Minimeter.prefs.setCharPref("errorExtraMessage", "extraDebug");
        }
        
        var regTestDebug = /debug/;
        
        if (regTestDebug.test(reply) /*&& this.pageContent !== null*/) {
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
            
              Minimeter.http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+this.pageContent+"&version="+extVersion+"&status=debug", "errorPing");
            }

          }
        }
        this.pageContent = null;
      }
    }
  }
  this.update(false);
};

Minimeter.Monitor.prototype.setFlatRateWithoutInfos = function() {
  this.totalVolume = 0;
  this.usedVolume = 0;
  this.extraMessage = Minimeter.getString("error.extraFlatRate", "Quota is not available for this flat rate connection.");
  Minimeter.prefs.setCharPref("errorExtraMessage", "extraFlatRate");
};

Minimeter.Monitor.prototype.isVersionLowerThan = function(versionToCheck, versionRef) {
  var vc =
     Components.classes["@mozilla.org/xpcom/version-comparator;1"].
     getService(Components.interfaces.nsIVersionComparator);
  return (vc.compare(versionToCheck, versionRef) < 0);
};



Minimeter.Monitor.prototype.setErrorMessageAndPref = function(error, extraError, setMessage) {
  this.error = error;
  Minimeter.prefs.setCharPref("error", error);
  if (setMessage === true)
    this.errorMessage = Minimeter.getString("error."+error, "incomplete translation");
  
  if (extraError !== null) {
    Minimeter.prefs.setCharPref("errorExtraMessage", extraError);
    this.extraMessage = Minimeter.getString("error."+extraError, "incomplete translation");
  }
};

Minimeter.Monitor.prototype.noConnectionLinked = function() {
  this.setErrorMessageAndPref("noConnectionLinked", "noConnectionLinkedExtra", true);

	this.update(false);
};

Minimeter.Monitor.prototype.userActionRequired = function() {
  this.setErrorMessageAndPref("userActionRequired", "userActionRequiredExtra", true);

	this.update(false);
};

Minimeter.Monitor.prototype.badLoginOrPass = function(provider) {
  if(provider=="belgacom")
    this.setErrorMessageAndPref("badLoginOrPass", "badLoginOrPassBg", true);
  else if (provider=="edpnet")
    this.setErrorMessageAndPref("badLoginOrPass", "badLoginOrPassEd", true);
  else
    this.setErrorMessageAndPref("badLoginOrPass", null, true);
    
	this.update(false);
};

Minimeter.Monitor.prototype.getExtVersion = function() {
  var nsIUpdateItem = Components.interfaces.nsIUpdateItem;
  var itemType = nsIUpdateItem.TYPE_EXTENSION;
  var liExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
                .getService(Components.interfaces.nsIExtensionManager);
            
  var items = liExtensionManager.getItemList(itemType, { });
  var extVersion;
  for (var i in items) {
    if (items[i].id == "{08ab63e1-c4bc-4fb7-a0b2-55373b596eb7}" ) {
      extVersion = items[i].version;
    }
  }
  
  return extVersion;
};

Minimeter.Monitor.prototype.cleanPage = function(pageContent) {
  pageContent = decodeURIComponent(pageContent);
  var regUsername = new RegExp("" + this.username + "", "gi");
  var regPassword = new RegExp("" + this.password + "", "gi");
  var textToReplace = Minimeter.prefs.getCharPref('textToReplace');

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

Minimeter.Monitor.prototype.errorPing = function(status) {
  var date = new Date().getDate();
  var allowPing = Minimeter.prefs.getBoolPref('allowPing');
  var lastPing = Minimeter.prefs.getIntPref('lastPing');

  if (allowPing && date != lastPing) {
		var extVersion = this.getExtVersion();
    Minimeter.prefs.setIntPref('lastPing', date);
    var module = this.image.substring(0,this.image.indexOf("."));
    
    Minimeter.http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+"&version="+extVersion+"&status="+status, "errorPing");
  }
};

Minimeter.Monitor.prototype.tryAgain = function(step) {
  this.trialNumber++;
  this.callback(step);
};

/*
 * Is called at the end of the transaction
 */ 
Minimeter.Monitor.prototype.update = function(success) {
	
  if(this.state == this.STATE_ABORT){
    return;
  }
          
  if(success){
    this.usedVolume = (Math.round(this.usedVolume * 1000)/1000).toFixed(3);
    this.totalVolume = (Math.round(this.totalVolume * 1000)/1000).toFixed(3);
    this.state = this.STATE_DONE;
    if(this.remainingDays != null && (this.totalVolume - this.usedVolume) > 0) {
      var remainingGB = Math.floor((Minimeter.monitor.totalVolume - Minimeter.monitor.usedVolume) / Minimeter.monitor.remainingDays * 1000) /1000;
      var remainingMB = Math.floor((remainingGB - Math.floor(remainingGB)) * (this.useSIPrefixes ? 1000 : 1024));
      Minimeter.monitor.remainingAverage = (remainingGB>=1 ? Math.floor(remainingGB) + Minimeter.monitor.measure + " " : "") + remainingMB + Minimeter.monitor.measureMB + " " + Minimeter.getString("info.remainingAverage", "per remaining day");
    }
    Minimeter.prefs.setCharPref("error", "no");
    this.storeCache();
    this.errorPing("success");
  }
  else {
    this.state = this.STATE_ERROR;
    this.clearCache();
  }
  
  this.notify();

};

Minimeter.Monitor.prototype.aborted = function(){
  return (this.state == this.STATE_ABORT);
};

 


Minimeter.Monitor.prototype.addListener = function(listener){
  if(!this.listeners.contains(listener)){
      this.listeners.push(listener);
  }
};

Minimeter.Monitor.prototype.removeListener = function(listener){
  this.listeners.remove(listener);
};
Minimeter.Monitor.prototype.removeAllListeners = function(listener){
  this.listeners = new Minimeter.JArray();
};

Minimeter.Monitor.prototype.notify = function(){
  for(var i=0;i<this.listeners.length;i++){
      this.listeners[i].update(this);
  }
};

Minimeter.Monitor.prototype.checkCache = function(calledByTimeout){
  var updateTimeout = Minimeter.prefs.getIntPref('updateTimeout');
  if (updateTimeout < 60) {
    if (updateTimeout == 0)
      updateTimeout = 1;
		updateTimeout = updateTimeout * 3600;
		Minimeter.prefs.setIntPref('updateTimeout', updateTimeout);
  }
  else
    if (updateTimeout < 300)
      Minimeter.prefs.setIntPref('updateTimeout', 300);
  if (this.name == "Telenet" && updateTimeout < 1800)
    Minimeter.prefs.setIntPref('updateTimeout', 1800);
    
  updateTimeout = updateTimeout * 1000;
  var errorpref = Minimeter.prefs.getCharPref('error');
  if(errorpref != "no") {
    if(calledByTimeout != "error" && errorpref !="badLoginOrPass") {
      Minimeter.prefs.setCharPref('error','isit');
      setTimeout("Minimeter.monitor.checkCache('error');", 100);
    }
    else {
      if (errorpref != "isit") {
        if (errorpref == "checking")
          this.state = this.STATE_BUSY;
        else {
          this.state = this.STATE_ERROR;
          this.error = errorpref;
          this.errorMessage = Minimeter.getString("error."+this.error, "incomplete translation");
          errorExtraMessage = Minimeter.prefs.getCharPref('errorExtraMessage');
          if (errorExtraMessage != '')
            this.extraMessage = Minimeter.getString("error."+errorExtraMessage, "incomplete translation");
          if (errorpref == "reported") {
            Minimeter.monitor.image = "info.png";
            if (this.toolbarMeter != null) {
              Minimeter.toolbarMeter.icon = Minimeter.monitor.image;
              Minimeter.toolbarMeter.showIcon = true;
            }
            else {
              Minimeter.statusbarMeter.icon = Minimeter.monitor.image;
              Minimeter.statusbarMeter.showIcon = true;
            }
            Minimeter.monitor.url = Minimeter.prefs.getCharPref('url');
          }
        }
        this.notify();
      }
      else {
        this.check();
        setTimeout("Minimeter.monitor.checkCache(true);", updateTimeout);
      }
    }
  }
  else {
    var provider = Minimeter.prefs.getCharPref('provider');
    var cache = Minimeter.prefs.getCharPref('cache');
    var now = new Date().getTime();
    
    cache = cache.split(";");
  
    if(cache.length >= 5){ // empty cache ?
      // check time
      
      if (cache[0] == provider) {
        var now = new Date().getTime();
        now -= (updateTimeout);
        if(cache[1] > (now + 4000) && cache[1] < (now + 4000 + updateTimeout)) {
          cache[6] = false;
          Minimeter.prefs.setCharPref('cache', cache.join(";"));
          this.loadCache();
          //Minimeter.consoleDump(now-cache[1]);
          if(!calledByTimeout)
            setTimeout("Minimeter.monitor.checkCache(true);", updateTimeout);
          //this.check();
        }
        else {
          this.check();
          setTimeout("Minimeter.monitor.checkCache(true);", updateTimeout);
          //Minimeter.consoleDump("ok " + (now-cache[1]));
        }
      }
    }
    else {
      this.check();
      setTimeout("Minimeter.monitor.checkCache(true);", updateTimeout);
    }
  }
};

Minimeter.Monitor.prototype.loadCache = function(isNotNewWindow){
  var cache = Minimeter.prefs.getCharPref('cache');
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

Minimeter.Monitor.prototype.checkIfDataIsNew = function(checkCacheNewData){
  var cache = Minimeter.prefs.getCharPref('cache');
  
  cache = cache.split(";");
  if(!checkCacheNewData)
  {
    if(this.usedVolume != cache[2] || this.totalVolume != cache[3] || this.remainingDays != cache[4])
      this.newData = true;
  }
  else
    this.newData = (cache[6] == "true");
};

Minimeter.Monitor.prototype.storeCache = function(){
  var provider = Minimeter.prefs.getCharPref('provider');
  
  this.checkIfDataIsNew(false);
  
  var cache = new Array();
  
  cache[0] = provider;
  cache[1] = new Date().getTime();
  cache[2] = this.usedVolume;
  cache[3] = this.totalVolume;
  cache[4] = this.remainingDays;
  cache[5] = this.extraMessage;
  cache[6] = this.newData;
  cache[7] = this.amountToPay;
  cache[8] = this.remainingAverage;
  
  Minimeter.prefs.setCharPref('cache', cache.join(";"));
};

Minimeter.Monitor.prototype.clearCache = function(){
  Minimeter.prefs.setCharPref('cache', '');
};

