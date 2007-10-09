function Monitor(){

	this.listeners = new JArray();
  this.state = this.STATE_DONE;	
  this.errorMessage = "";
	this.extraMessage = null;
	this.remainingDays = null;
	this.amountToPay = null;
	this.remainingAverage = null;
	this.newData = false; // is the new data different from the old one ? (for the animation)

}

Monitor.prototype.STATE_BUSY = 2;
Monitor.prototype.STATE_ERROR = 1;
Monitor.prototype.STATE_DONE = 0;
Monitor.prototype.STATE_ABORT = 3;

Monitor.prototype.check = function() { // override default action
  this.state = this.STATE_BUSY;
  this.notify();
  this.newData = true;
  this.callback(1);
}


Monitor.prototype.abort = function(){
    this.state = this.STATE_ABORT;
}

Monitor.prototype.getCapacity = function(){
	capacity = prefs.getIntPref('capacity');
	return capacity;
}

Monitor.prototype.notLoggedin = function(){
	this.errorMessage = getString("error.login");
	this.update(false);
}

Monitor.prototype.badLoginOrPass = function(provider){
  this.errorMessage = getString("error.badLoginOrPass");
  if(provider=="belgacom")
    this.extraMessage = getString("error.badLoginOrPassBg");
	this.update(false);
}

Monitor.prototype.unknownError = function(step,monitor){
	this.errorMessage = getString("error.unknownError");
	var dumpMessage = getString("error.unknownErrorDump").replace ("%step", step);
	dumpMessage = dumpMessage.replace ("%monitor", monitor);
	consoleDump(dumpMessage);
	this.update(false);
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
    this.storeCache();
  } else {
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
  provider = prefs.getCharPref('provider');
  cache = prefs.getCharPref('cache');
  updateTimeout = prefs.getIntPref('updateTimeout');
  updateTimeout = updateTimeout * 1000 * 3600;
  var now = new Date().getTime();
  
  cache = cache.split(";");

  if(cache.length >= 5){ // empty cache ?
    // check time
    
    if (cache[0] == provider) {
      var now = new Date().getTime();
      now -= (updateTimeout);
      if(cache[1] > (now + 4000) && cache[1] < (now + 4000 + updateTimeout)) {
        cache[6] = false;
        prefs.setCharPref('cache', cache.join(";"));
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

Monitor.prototype.loadCache = function(isNotNewWindow){
  var cache = prefs.getCharPref('cache');
  cache = cache.split(";");
  if(cache.length > 1) {
    this.state = this.STATE_DONE;
    this.usedVolume = cache[2];
    this.totalVolume = cache[3];
    if(cache[4] != '')
      this.remainingDays = cache[4];
    if(cache[5] != '')
      this.extraMessage = cache[5];
    if(cache[7] != '') // 6 is newData
      this.amountToPay = cache[7];
    if(cache[8] != '')
      this.remainingAverage = cache[8];
  
    //this.extraMessage += "(from cache)";
    
    if(isNotNewWindow == true)
      this.checkIfDataIsNew(true);
    else
      this.newData = false;
  }
  else {
    this.state = this.STATE_ERROR;
  }
    
  this.notify();
}

Monitor.prototype.checkIfDataIsNew = function(checkCacheNewData){
  cache = prefs.getCharPref('cache');
  
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
  provider = prefs.getCharPref('provider');
  
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
  
  prefs.setCharPref('cache', cache.join(";"));
}

Monitor.prototype.clearCache = function(){
  prefs.setCharPref('cache', '');
}

