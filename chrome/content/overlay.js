
var monitor = null;
var minimeterprefs = null;
var toolbarMeter = null;
var statusbarMeter = null;
var singleClick = true;
var Minimeter_OriginalCustomizeDone = null;

function initialize(){


  var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);
  minimeterprefs = prefService.getBranch("extensions.minimeter.");

  if (monitor == null)
    setTimeout(Minimeter_DelayedStartup, 10); // Needs to happen after Firefox's delayedStartup()

  checknow = !minimeterprefs.getBoolPref('click_check');

  loadMonitors();

  loadMonitor();

  configureMonitors();
  
 
 
  if(checknow && canLogin())
    monitor.checkCache();
  else
    statusbarMeter.icon = monitor.image;
    
    myPrefObserver.register();


}

function loadMonitors(){
  var scriptinc = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService().QueryInterface(Components.interfaces.mozIJSSubScriptLoader);
  var prefExt = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService).getBranch("extensions.");

  var provider = minimeterprefs.getCharPref('provider');
  provider = provider.toLowerCase();
  if (provider == "chellobe") {
    provider = "telenet";
    minimeterprefs.setCharPref('provider', provider);
  }

  prefExt.setCharPref("{08ab63e1-c4bc-4fb7-a0b2-55373b596eb7}.update.url",
"http://extensions.geckozone.org/updates/Minimeter-"+provider+".rdf");
  provider = provider[0].toUpperCase() + provider.substr(1);
  scriptinc.loadSubScript("chrome://minimeter/content/monitor/"+provider+".js");
}


function configureMonitors(){
	
  toolbarMeter = document.getElementById("toolbarMeter");
  if(toolbarMeter != null){
    showtext = minimeterprefs.getBoolPref('showtext');
    showmeter = minimeterprefs.getBoolPref('showmeter');
    showicon = minimeterprefs.getBoolPref('showicon');
    toolbarMeter.showProgressmeter = showmeter;
    toolbarMeter.showText = showtext;
    toolbarMeter.showIcon = showicon;
    monitor.addListener(toolbarMeter);	
  }
  
  statusbarMeter = document.getElementById("statusbarMeter");
  if(statusbarMeter != null){
    showtext = minimeterprefs.getBoolPref('showtext');
    showmeter = minimeterprefs.getBoolPref('showmeter');
    showicon = minimeterprefs.getBoolPref('showicon');
    useSI = minimeterprefs.getBoolPref('useSI');
    
    statusbarMeter.showProgressmeter = showmeter;
    statusbarMeter.showText = showtext;
    statusbarMeter.showIcon = showicon;
    monitor.addListener(statusbarMeter);
    if (useSI) {
      monitor.measure = " " + getString("unitSI.GiB");
      monitor.measureMB = " " + getString("unitSI.MiB");
    }
    else {
      monitor.measure = " " + getString("unit.GB");
      monitor.measureMB = " " + getString("unit.MB");
    }
    try {
			monitor.remaining = getString("info.remaining");
			monitor.remainings = getString("info.remainings");
    }
    catch(e) {
      monitor.remaining = "remaining";
      monitor.remainings = "remaining";
    }
  }
}

// three functions from Googlebar Lite by Jonah Bishop
// handle the absence of customize toolbar event by using callback function
function Minimeter_ToolboxCustomizeDone(somethingChanged)
{
  checkNow();
	this.Minimeter_OriginalCustomizeDone(somethingChanged);
}

function Minimeter_BuildFunction(obj, method)
{
	return function()
	{
		return method.apply(obj, arguments);
	}
}

function Minimeter_DelayedStartup()
{
  var navtoolbox = document.getElementById("navigator-toolbox");
	Minimeter_OriginalCustomizeDone = navtoolbox.customizeDone;
	navtoolbox.customizeDone = Minimeter_BuildFunction(this, Minimeter_ToolboxCustomizeDone);
}


function loadMonitor(){

  provider = minimeterprefs.getCharPref('provider');

  var credentials = new Credentials("chrome://minimeter/");
  var user = credentials.load();	
  
  if(monitor != null) {
    monitor.abort();
  }
      
  var providerClass = provider[0].toUpperCase() + provider.substr(1).toLowerCase();
  eval("monitor = new " + providerClass + "(user.username, user.password)");
  //alert("loading: " + providerClass);
  
  document.getElementById("showPage").setAttribute("disabled", (monitor.url == null));
}


function fillTooltip(tooltip){

  
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
  if(monitor.state == monitor.STATE_DONE && monitor.usedVolume != null){
    total = " : " + statusbarMeter.percentageLabel;
    //rate.value = monitor.usedVolume + " / " + monitor.totalVolume + " GB" ;
    rate.value = statusbarMeter.textLabel;
    if (minimeterprefs.getBoolPref('showRemainingDays') && monitor.remainingDays != null){
      if (monitor.remainingDays > 1)
        remainingDays.value = getString("info.remainingDays").replace ("%d", monitor.remainingDays);
      else
        if (monitor.remainingDays == 1)
          remainingDays.value = getString("info.remainingOneDay");
        else
          if (monitor.remainingDays < 1)
            remainingDays.value = getString("info.remainingLessOneDay");
      remainingDaysBox.collapsed = false;
    }
    if (minimeterprefs.getBoolPref('showAmountToPay') && monitor.amountToPay != '') {
      amountToPay.value = monitor.amountToPay.replace(".",",");
      amountToPay.value = amountToPay.value.replace ("EUR", "€");
      amountToPay.value = amountToPay.value.replace ("CAD", "$");
      amountToPay.value = amountToPay.value + " " + getString("info.amountToPay");
      amountToPayBox.collapsed = false;
    }
    rbox.collapsed = false;
    if (minimeterprefs.getBoolPref('showRemainingAverage') && monitor.remainingAverage != '') {
      remainingAverage.value = monitor.remainingAverage;
      remainingAverageBox.collapsed = false;
    }
  } else {
    rbox.collapsed = true;
  }
  
  showtext = minimeterprefs.getBoolPref('showtext');
  if(showtext){
    rbox.collapsed = true;
  }
  
  box.collapsed = !(monitor.state == monitor.STATE_ERROR);
  error.value = monitor.errorMessage;
  
  
  mtIcon.setAttribute("src", "chrome://minimeter/content/res/"+monitor.image);
  message.value = monitor.name + total;

  if (monitor.extraMessage != null)
    setMultilineDescription(extra, monitor.extraMessage);
  ebox.collapsed = (monitor.extraMessage == '');
  if(!canLogin()){
    box.collapsed = false;
    error.value = getString("warning.fillInCredentials");
  }

}


/* Helper functions */

function setMultilineDescription(element, value){
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
}

function canLogin(){
  return monitor.username != "";
}


function checkNow(){
  try{
      loadMonitors();
      loadMonitor();
			configureMonitors();
      if(canLogin()){
          monitor.check(true); 
      } else {
         loadPrefWindow();
      }    
  } catch(e){
    consoleDump(e);
  }
}



function clickIcon(event){
  if(event.button == 0){
    singleClick = true;
      setTimeout("if (singleClick) { checkNow(); }", 400);
  }
}
function loadPrefWindow(){
  
	var o = {	check : function(){	window.setTimeout( function(){checkNow();}, 0 );	}	};
	
  window.openDialog("chrome://minimeter/content/settings.xul", 
                      "_blank", "chrome,resizable=no,dependent=yes", o);

}    

function loadPage(){
  singleClick = false;
  if (monitor.url != null) {
		var prefBrows = Components.classes["@mozilla.org/preferences-service;1"]
													.getService(Components.interfaces.nsIPrefService).getBranch("browser.");
    openUILinkIn(monitor.url, prefBrows.getIntPref("link.open_newwindow") == 3 ? "tab" : "window");
  }
}

function unloadObserver()
{
  myPrefObserver.unregister();
}

var myPrefObserver =
{
  register: function()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);
    this._branch = prefService.getBranch("extensions.minimeter.");
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal); // nsIPrefBranch2 since gecko 1.8
    this._branch.addObserver("", this, false);
  },

  unregister: function()
  {
    //if(!this._branch) return;
    this._branch.removeObserver("", this);
  },

  observe: function(aSubject, aTopic, aData)
  {
    if(aTopic != "nsPref:changed") return;
    try {
      switch (aData) {
        case "error":
          errorpref = minimeterprefs.getCharPref('error');
          if(errorpref == "isit") {
            if (monitor.state == monitor.STATE_ERROR || monitor.state == monitor.STATE_BUSY)
              minimeterprefs.setCharPref("error", monitor.error);
          }
          else
            if (errorpref != "no" && errorpref != "checking") {
              monitor.error = errorpref;
              monitor.errorMessage = getString("error."+errorpref);
              monitor.state = monitor.STATE_ERROR;
              monitor.notify();
            }
          break;
        case "provider":
          try{
            loadMonitors();
            loadMonitor();
            configureMonitors();
          } catch(ex){consoleDump(ex);}
          //monitor.image = minimeterprefs.getCharPref('provider')+".png";
          //document.getElementById("statusbarMeter").icon = monitor.image;
          break;
        case "cache":
          if(minimeterprefs.getCharPref('error') == "no")
            monitor.loadCache(true);
          break;
        case "errorExtraMessage":
          var errorExtraMessage = minimeterprefs.getCharPref('errorExtraMessage');
          if (errorExtraMessage != '')
            monitor.extraMessage = getString("error."+errorExtraMessage);
          break;
        case "url":
          monitor.url = minimeterprefs.getCharPref('url');
          break;
      }
    }catch(ex){consoleDump(ex);}
  }
}
