function Monitor(){

	this.listeners = new JArray();
  this.state = this.STATE_DONE;	
  this.errorMessage = "";
	this.extraMessage = null;
	this.remaining = null;
	this.useCache = true;

}

Monitor.prototype.STATE_BUSY = 2;
Monitor.prototype.STATE_ERROR = 1;
Monitor.prototype.STATE_DONE = 0;
Monitor.prototype.STATE_ABORT = 3;

Monitor.prototype.check = function() { // override default action
		this.state = this.STATE_BUSY;
		this.notify();
		this.callback(1);
}


Monitor.prototype.abort = function(){
    this.state = this.STATE_ABORT;
}

Monitor.prototype.getCapacity = function(){
	try{ capacity = prefs.getIntPref('capacity'); } catch(ex) { capacity = 10; }
	return capacity;
}

Monitor.prototype.notLoggedin = function(){
	this.errorMessage = getString("error.login");
	this.update(false);
}

Monitor.prototype.badLoginOrPass = function(){
	this.errorMessage = getString("error.badLoginOrPass");
	this.update(false);
}

Monitor.prototype.badLoginOrPass = function(){
	this.errorMessage = getString("error.badLoginOrPass");
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
		  if(this.useCache) this.storeCache();
    } else {
      this.state = this.STATE_ERROR;	
      if(this.useCache) this.clearCache();
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




Monitor.prototype.hasCache = function(seconds){
	    try{provider = prefs.getCharPref('provider');}catch(e){provider = "skynet";} 
	    try{cache = prefs.getCharPref('cache');}catch(e){cache = "";} 

	    cache = cache.split(";");

	    if(cache.length >= 5){
	    	// check time
	    	
	    	
				if (cache[0] == provider) {
					var nu = new Date().getTime();
					nu -= (seconds * 1000);
					return (cache[1] > nu);
				
				}
	    } else {
	      return false;
	    }
}

Monitor.prototype.loadCache = function(){
	    try{provider = prefs.getCharPref('provider');}catch(e){provider = "skynet";} 
	    try{cache = prefs.getCharPref('cache');}catch(e){cache = "";} 

	    cache = cache.split(";");
	    this.usedVolume = cache[2];
	    this.totalVolume = cache[3];
	    if(cache[4] != '')
	    	this.remaining = cache[4];
	    if(cache[5] != '')
	    	this.extraMessage = cache[5];

	    //this.extraMessage += "(from cache)";
	    
	    this.notify();
}

Monitor.prototype.storeCache = function(){
	    try{provider = prefs.getCharPref('provider');}catch(e){provider = "skynet";} 
	    
	    cache = new Array();
	    
			cache[0] = provider;
			cache[1] = new Date().getTime();
	    cache[2] = this.usedVolume;
	    cache[3] = this.totalVolume;
	    cache[4] = this.remaining;
	    cache[5] = this.extraMessage;
	    
	    prefs.setCharPref('cache', cache.join(";"));
}

Monitor.prototype.clearCache = function(){

	    prefs.setCharPref('cache', '');
}

