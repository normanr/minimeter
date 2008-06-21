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

}

Monitor.prototype.STATE_BUSY = 2;
Monitor.prototype.STATE_ERROR = 1;
Monitor.prototype.STATE_DONE = 0;
Monitor.prototype.STATE_ABORT = 3;

Monitor.prototype.check = function(silent) { // override default action
  this.extraMessage = '';
  minimeterprefs.setCharPref("errorExtraMessage", '');
  if(silent != "silent")
    this.state = this.STATE_BUSY;
	this.error = "checking";
  minimeterprefs.setCharPref("error", "checking");
  this.notify();
  this.newData = true;
  this.callback(1);
}


Monitor.prototype.abort = function(){
    this.state = this.STATE_ABORT;
}

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
}

Monitor.prototype.reportError = function(step, monitor, reply){
  if (this.error == "connection" || this.error == "server") {
    this.errorMessage = getString("error."+this.error);
	  minimeterprefs.setCharPref("error", this.error);
    setTimeout("monitor.check('silent');", 60000);
  }
  else {
    if (reply == null) {
      this.error = "unknown";
      minimeterprefs.setCharPref("error", "unknown");
      this.errorPing("failed");
      if (step != null) {
        var dumpMessage = getString("error.unknownErrorDump").replace ("%step", step);
        dumpMessage = dumpMessage.replace ("%monitor", monitor);
        consoleDump(dumpMessage);
      }
      var module = this.image.substring(0,this.image.indexOf("."));
      http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+"&status=check", "reportError");
    }
    else {
      reply = unescape(reply);
      var regteststatus = /moduleisfailing/;
      if (regteststatus.test(reply)) {
        this.errorMessage = getString("error.reported");
        this.extraMessage = getString("error.extraReported");
        minimeterprefs.setCharPref("errorExtraMessage", "extraReported");
      }
      else {
        this.errorMessage = getString("error.unknown");
      }
    }
  }
  this.update(false);
}

Monitor.prototype.badLoginOrPass = function(provider){
  this.errorMessage = getString("error.badLoginOrPass");
  this.error = "badLoginOrPass";
  minimeterprefs.setCharPref("error", "badLoginOrPass");
  if(provider=="belgacom") {
    this.extraMessage = getString("error.badLoginOrPassBg");
    minimeterprefs.setCharPref("errorExtraMessage", "badLoginOrPassBg");
  }
  else if (provider=="edpnet") {
    this.extraMessage = getString("error.badLoginOrPassEd");
    minimeterprefs.setCharPref("errorExtraMessage", "badLoginOrPassEd");
  }
	this.update(false);
}

Monitor.prototype.errorPing = function(status){
  var date = new Date().getDate();
  var lastPing = minimeterprefs.getIntPref('lastPing');
  if (date != lastPing) {
    minimeterprefs.setIntPref('lastPing', date);
    var module = this.image.substring(0,this.image.indexOf("."));
    consoleDump("Sending error ping to developer for module "+ this.name);
    http_post("http://extensions.geckozone.org/actions/minimeter.php", "module="+module+"&status="+status, "errorPing");
  }
}

/*
 * Is called at the end of the transaction
 */ 
Monitor.prototype.update = function(success) {
	
  if(this.state == this.STATE_ABORT){
    return;
  }
          
  if(success){
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

}

Monitor.prototype.aborted = function(){
  return (this.state == this.STATE_ABORT);
}

 


Monitor.prototype.addListener = function(listener){
  if(!this.listeners.contains(listener)){
      this.listeners.push(listener);
  }
}

Monitor.prototype.removeListener = function(listener){
  this.listeners.remove(listener);
}
Monitor.prototype.removeAllListeners = function(listener){
  this.listeners = new JArray();
}

Monitor.prototype.notify = function(){
  for(i=0;i<this.listeners.length;i++){
      this.listeners[i].update(this);
  }
}

Monitor.prototype.checkCache = function(calledByTimeout){
  updateTimeout = minimeterprefs.getIntPref('updateTimeout');
  if (updateTimeout < 60) {
		updateTimeout = updateTimeout * 3600;
		minimeterprefs.setIntPref('updateTimeout', updateTimeout);
  }
  updateTimeout = updateTimeout * 1000;
  var errorpref = minimeterprefs.getCharPref('error');
  if(errorpref != "no") {
    if(calledByTimeout != "error") {
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
}

Monitor.prototype.loadCache = function(isNotNewWindow){
  var cache = minimeterprefs.getCharPref('cache');
  cache = cache.split(";");
  this.state = this.STATE_DONE;
  this.usedVolume = cache[2];
  this.totalVolume = cache[3];
//if(cache[4] != '')
  this.remainingDays = cache[4];
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
}

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
}

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
}

Monitor.prototype.clearCache = function(){
  minimeterprefs.setCharPref('cache', '');
}

