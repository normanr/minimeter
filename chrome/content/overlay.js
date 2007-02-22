
var monitor = null;
var prefs = null;
var toolbarMeter = null;
var statusbarMeter = null;

function initialize(){


    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
    prefs = prefService.getBranch("extensions.minimeter.");
    


    try{checknow = !prefs.getBoolPref('click_check');}catch(e){checknow = true;}

		loadMonitors();

    loadMonitor();

		configureMonitors();
   
   
    if(checknow && canLogin()){
    	
		   	if(monitor.hasCache(60 * 60)) {
		   		monitor.loadCache();
		  	} else {
        	monitor.check();
      	}
    } else {
        statusbarMeter.icon = monitor.image;
    }
		

}

function loadMonitors(){
			var scriptinc = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService().QueryInterface(Components.interfaces.mozIJSSubScriptLoader);
		
    	for(i=0; i < monitors.length; i++){
    		m = monitors[i].split(":")[0];
    		
    		if(m[0] != "_"){ // Country
    			if(m[0] == "#"){ // remove flat sign
    				m = m.substr(1)
    			}  

					scriptinc.loadSubScript("chrome://minimeter/content/monitor/"+m+".js");
    		}

    	}
}


function configureMonitors(){
	
		toolbarMeter = document.getElementById("toolbarMeter");
		if(toolbarMeter != null){
			toolbarMeter.showProgressmeter = true;
			toolbarMeter.showText = false;
			toolbarMeter.showIcon = false;
			monitor.addListener(toolbarMeter);	
		}
		
		statusbarMeter = document.getElementById("statusbarMeter");
		if(statusbarMeter != null){
    	try{ showtext = prefs.getBoolPref('showtext'); } catch(ex) { showtext = true; }
    	try{ showmeter = prefs.getBoolPref('showmeter'); } catch(ex) { showmeter = false; }
			try{ useSI = prefs.getBoolPref('useSI'); } catch(ex) { useSI = true; }
			
			statusbarMeter.showProgressmeter = showmeter;
			statusbarMeter.showText = showtext;
			statusbarMeter.showIcon = true;
			monitor.addListener(statusbarMeter);
			if (useSI)
				monitor.measure = " " + getString("unitSI.GiB");
			else
				monitor.measure = " " + getString("unit.GB");


		}
		
}



function loadMonitor(){

    try{provider = prefs.getCharPref('provider');}catch(e){provider = "skynet";} 

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
    var remainingBox = document.getElementById("remainingBox");
    var error = document.getElementById("errorMessage");
    var message = document.getElementById("message");
    var remaining = document.getElementById("remaining");
    var rate = document.getElementById("rate");
    var extra = document.getElementById("extra");
    
    var total = "";
    remainingBox.collapsed = true;
    if(monitor.state == monitor.STATE_DONE && monitor.usedVolume != null){
      total = ": " + statusbarMeter.procentLabel;
      //rate.value = monitor.usedVolume + " / " + monitor.totalVolume + " GB" ;
      rate.value = statusbarMeter.textLabel;
      if (monitor.remaining != null){
        if (monitor.remaining > 1)
          remaining.value = getString("info.remainingDays").replace ("%d", monitor.remaining);
        else
          if (monitor.remaining == 1)
            remaining.value = getString("info.remainingOneDay");
          else
            if (monitor.remaining < 1)
              remaining.value = getString("info.remainingLessOneDay");
        remainingBox.collapsed = false;
      }
      rbox.collapsed = false;
    } else {
    	rbox.collapsed = true;
  	}
  	
  	try{ showtext = prefs.getBoolPref('showtext'); } catch(ex) { showtext = true; }
  	if(showtext){
  		rbox.collapsed = true;
  	}
    
    box.collapsed = !(monitor.state == monitor.STATE_ERROR);
    error.value = monitor.errorMessage;
    
    
    
    message.value = monitor.name + total;
    message.style.background = "url(chrome://minimeter/content/res/"+monitor.image+") 0px 0px no-repeat";

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
      loadMonitor();
			configureMonitors();
      if(canLogin()){
          monitor.check(); 
      } else {
         loadPrefWindow();
      }    
  } catch(e){
    alert(e);
  }
}



function clickIcon(event){
  if(event.button == 0){
    checkNow();
  }
}
function loadPrefWindow(){
  
	var o = {	check : function(){	window.setTimeout( function(){checkNow();}, 0 );	}	};
	
  window.openDialog("chrome://minimeter/content/settings.xul", 
                      "_blank", "chrome,resizable=no,dependent=yes", o);

}    

function loadPage(){
  getBrowser().loadURI(monitor.url);

}

window.addEventListener("load", initialize, false);
