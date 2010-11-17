var Minimeter = {
  monitor: null,
  prefs: Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService).getBranch("extensions.minimeter."),
  toolbarMeter: null,
  statusbarMeter: null,
  singleClick: true,
  OriginalCustomizeDone: null,
  
  initialize: function(){
    if (Minimeter.monitor == null)
      setTimeout("Minimeter.DelayedStartup()", 10); // Needs to happen after Firefox's delayedStartup()
  
    var checknow = !Minimeter.prefs.getBoolPref('click_check');
  
    Minimeter.loadMonitors();
    Minimeter.loadMonitor();
    Minimeter.configureMonitors();
    
    if(checknow && Minimeter.canLogin())
      Minimeter.monitor.checkCache();
    else
      Minimeter.statusbarMeter.icon = Minimeter.monitor.image;
      
    Minimeter.myPrefObserver.register();
  },

  loadMonitors: function(){
    var scriptinc = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService().QueryInterface(Components.interfaces.mozIJSSubScriptLoader);
    var prefExt = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService).getBranch("extensions.");
  
    var provider = this.prefs.getCharPref('provider');
    
    if (provider == "chellobe") {
      provider = "telenet";
      this.prefs.setCharPref('provider', provider);
    }
    
   prefExt.setCharPref("{08ab63e1-c4bc-4fb7-a0b2-55373b596eb7}.update.url",
  "http://extensions.geckozone.org/updates/Minimeter-"+provider+".rdf");
    provider = provider[0].toUpperCase() + provider.substr(1);
    scriptinc.loadSubScript("chrome://minimeter/content/monitor/"+provider+".js");
  },

  configureMonitors: function(){
    var showtext;
    var showmeter;
    var showicon;
    var useIEC;
    this.toolbarMeter = document.getElementById("toolbarMeter");
    if(this.toolbarMeter != null){
      showtext = this.prefs.getBoolPref('showtext');
      showmeter = this.prefs.getBoolPref('showmeter');
      showicon = this.prefs.getBoolPref('showicon');
      this.toolbarMeter.showProgressmeter = showmeter;
      this.toolbarMeter.showText = showtext;
      this.toolbarMeter.showIcon = showicon;
      this.monitor.addListener(this.toolbarMeter);	
    }
    
    this.statusbarMeter = document.getElementById("statusbarMeter");
    if(this.statusbarMeter != null){
      showtext = this.prefs.getBoolPref('showtext');
      showmeter = this.prefs.getBoolPref('showmeter');
      showicon = this.prefs.getBoolPref('showicon');
      useIEC = this.prefs.getBoolPref('useSI');
      
      this.statusbarMeter.showProgressmeter = showmeter;
      this.statusbarMeter.showText = showtext;
      this.statusbarMeter.showIcon = showicon;
      this.monitor.addListener(this.statusbarMeter);
      if (useIEC && !this.monitor.useSIPrefixes) {
        this.monitor.measure = " " + Minimeter.getString("unit.GiB", "GiB");
        this.monitor.measureMB = " " + Minimeter.getString("unit.MiB", "MiB");
      }
      else {
        this.monitor.measure = " " + Minimeter.getString("unit.GB", "GB");
        this.monitor.measureMB = " " + Minimeter.getString("unit.MB", "MB");
      }
      this.monitor.remaining = Minimeter.getString("info.remaining", "remaining");
      this.monitor.remainings = Minimeter.getString("info.remainings", "remaining");
    }
  },

  // three functions from Googlebar Lite by Jonah Bishop
  // handle the absence of customize toolbar event by using callback function
  ToolboxCustomizeDone: function(somethingChanged){
    this.checkNow();
    this.OriginalCustomizeDone(somethingChanged);
  },
  
  BuildFunction: function(obj, method){
    return function()
    {
      return method.apply(obj, arguments);
    }
  },
  
  DelayedStartup: function(){
    var navtoolbox = document.getElementById("navigator-toolbox");
    this.OriginalCustomizeDone = navtoolbox.customizeDone;
    navtoolbox.customizeDone = this.BuildFunction(this, this.ToolboxCustomizeDone);
  },
  
  loadMonitor: function(){
    var provider = this.prefs.getCharPref('provider');;
  
    var credentials = new Minimeter.Credentials("chrome://minimeter/");
    var user = credentials.load();	
    
    if(this.monitor != null) {
      this.monitor.abort();
    }
        
    var providerClass = provider[0].toUpperCase() + provider.substr(1).toLowerCase();
    //eval("monitor = new " + providerClass + "(user.username, user.password)");
    this.monitor = new Minimeter[providerClass](user.username, user.password);
    //alert("loading: " + providerClass);
    Minimeter.monitor.module = provider;
    
    document.getElementById("showPage").setAttribute("disabled", (this.monitor.url == null));
  },

  fillTooltip: function(tooltip){
    var box = document.getElementById("errorBox");
    var ebox = document.getElementById("extraBox");
    var rbox = document.getElementById("rateBox");
    var remainingDaysBox = document.getElementById("remainingDaysBox");
    var amountToPayBox = document.getElementById("amountToPayBox");
    var remainingAverageBox = document.getElementById("remainingAverageBox");
    var error = document.getElementById("errorMessage");
    var message = document.getElementById("message");
    var remainingDays = document.getElementById("remainingDays");
    var amountToPay = document.getElementById("amountToPay");
    var remainingAverage = document.getElementById("remainingAverage");
    var rate = document.getElementById("rate");
    var extra = document.getElementById("extra");
    var mtIcon = document.getElementById("mtIcon");
    
    var total = "";
    remainingDaysBox.collapsed = true;
    amountToPayBox.collapsed = true;
    remainingAverageBox.collapsed = true;
    if(this.monitor.state == this.monitor.STATE_DONE && this.monitor.usedVolume != null){
      total = " : " + this.statusbarMeter.percentageLabel;
      //rate.value = this.monitor.usedVolume + " / " + this.monitor.totalVolume + " GB" ;
      rate.value = this.statusbarMeter.textLabel;
      if (this.prefs.getBoolPref('showRemainingDays') && this.monitor.remainingDays != null){
        if (this.monitor.remainingDays > 1)
          remainingDays.value = Minimeter.getString("info.remainingDays", "%d days remaining before reset").replace ("%d", this.monitor.remainingDays);
        else
          if (this.monitor.remainingDays == 1)
            remainingDays.value = Minimeter.getString("info.remainingOneDay", "1 day remaining before reset");
          else
            if (this.monitor.remainingDays < 1)
              remainingDays.value = Minimeter.getString("info.remainingLessOneDay", "Less than one day before reset");
        remainingDaysBox.collapsed = false;
      }
      if (this.prefs.getBoolPref('showAmountToPay') && this.monitor.amountToPay != '') {
        amountToPay.value = this.monitor.amountToPay.replace(".",",");
        amountToPay.value = amountToPay.value.replace ("EUR", "€");
        amountToPay.value = amountToPay.value.replace ("CAD", "$");
        amountToPay.value = amountToPay.value + " " + Minimeter.getString("info.amountToPay", "extra");
        amountToPayBox.collapsed = false;
      }
      rbox.collapsed = false;
      if (this.prefs.getBoolPref('showRemainingAverage') && this.monitor.remainingAverage != '') {
        remainingAverage.value = this.monitor.remainingAverage;
        remainingAverageBox.collapsed = false;
      }
    } else {
      rbox.collapsed = true;
    }
    
    var showtext = this.prefs.getBoolPref('showtext');
    if(showtext || this.monitor.totalVolume === 0){
      rbox.collapsed = true;
    }
    
    box.collapsed = !(this.monitor.state == this.monitor.STATE_ERROR);
    error.value = this.monitor.errorMessage;
    
    mtIcon.setAttribute("src", "chrome://minimeter/content/res/"+this.monitor.image);
    message.value = this.monitor.name + total;
  
    if (this.monitor.extraMessage != null)
      this.setMultilineDescription(extra, this.monitor.extraMessage);
    ebox.collapsed = (this.monitor.extraMessage == '');
    if(!this.canLogin()){
      box.collapsed = false;
      error.value = Minimeter.getString("warning.fillInCredentials", "Fill in your credentials: open Minimeter preferences");
    }
  
  },

  /* Helper functions */
  
  setMultilineDescription: function(element, value){
    var lines = value.split('\n');
  
    while(element.firstChild != null){
       element.removeChild(element.firstChild);
    }
    
    for(var i = 0; i < lines.length; i++){     
       var descriptionNode = document.createElement("description");    
       var linetext = document.createTextNode(lines[i]);
       descriptionNode.appendChild(linetext);
       element.appendChild(descriptionNode);
    }
  },

  canLogin: function(){
    return this.monitor.username != "";
  },

  checkNow: function(){
    try{
        this.loadMonitors();
        this.loadMonitor();
        this.configureMonitors();
        if(this.canLogin()){
            this.monitor.check(true); 
        } else {
           this.loadPrefWindow();
        }    
    } catch(e){
      Minimeter.consoleDump(e);
    }
  },

  clickIcon: function(event){
    if(event.button == 0){
      this.singleClick = true;
        setTimeout("if (Minimeter.singleClick) { Minimeter.checkNow(); }", 400);
    }
  },

  loadPrefWindow: function(){
    var o = {	check : function(){	window.setTimeout( function(){Minimeter.checkNow();}, 0 );	}	};
    
    window.openDialog("chrome://minimeter/content/settings.xul", 
                        "_blank", "chrome,resizable=no,dependent=yes", o);
  },

  loadPage: function(){
    this.singleClick = false;
    if (this.monitor.url != null) {
      var prefBrows = Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService).getBranch("browser.");
      openUILinkIn(this.monitor.url, prefBrows.getIntPref("link.open_newwindow") == 3 ? "tab" : "window");
    }
  },

  unloadObserver: function(){
    Minimeter.myPrefObserver.unregister();
  },


  myPrefObserver: {
    register: function()
    {
      var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                  .getService(Components.interfaces.nsIPrefService);
      Minimeter._branch = prefService.getBranch("extensions.minimeter.");
      Minimeter._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal); // nsIPrefBranch2 since gecko 1.8
      Minimeter._branch.addObserver("", this, false);
    },
  
    unregister: function()
    {
      //if(!this._branch) return;
      Minimeter._branch.removeObserver("", this);
    },
  
    observe: function(aSubject, aTopic, aData)
    {
      if(aTopic != "nsPref:changed") return;
      try {
        switch (aData) {
          case "error":
            var errorpref = Minimeter.prefs.getCharPref('error');
            if(errorpref == "isit") {
              if (Minimeter.monitor.state == Minimeter.monitor.STATE_ERROR || Minimeter.monitor.state == Minimeter.monitor.STATE_BUSY)
                Minimeter.prefs.setCharPref("error", Minimeter.monitor.error);
            }
            else
              if (errorpref != "no" && errorpref != "checking") {
                Minimeter.monitor.error = errorpref;
                Minimeter.monitor.errorMessage = Minimeter.getString("error."+errorpref, "incomplete translation");
                if (errorpref in { "reported":1, "badLoginOrPass":1, "badLoginOrPassEd":1,
                                    "userActionRequired":1, "cookies":1 } ) {
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
                Minimeter.monitor.state = Minimeter.monitor.STATE_ERROR;
                Minimeter.monitor.notify();
              }
            break;
          case "provider":
            try{
              Minimeter.loadMonitors();
              Minimeter.loadMonitor();
              Minimeter.configureMonitors();
            } catch(ex){Minimeter.consoleDump(ex);}
            //Minimeter.monitor.image = Minimeter.prefs.getCharPref('provider')+".png";
            //document.getElementById("statusbarMeter").icon = Minimeter.monitor.image;
            break;
          case "cache":
            if(Minimeter.prefs.getCharPref('error') == "no")
              Minimeter.monitor.loadCache(true);
            break;
          case "errorExtraMessage":
            var errorExtraMessage = Minimeter.prefs.getCharPref('errorExtraMessage');
            if (errorExtraMessage != '')
              Minimeter.monitor.extraMessage = Minimeter.getString("error."+errorExtraMessage, "incomplete translation");
            break;
          case "url":
            Minimeter.monitor.url = Minimeter.prefs.getCharPref('url');
            break;
        }
      }catch(ex){Minimeter.consoleDump(ex);}
    }
  }


};

