		/*
			"Classname:Realname"
			_ = country
			# = custom capacity
		*/
		var monitors = new Array(	"_Belgium", "Starsadsl:3Stars ADSL", "ADSL20", "Belcenter", "Skynet:Belgacom", "Clearwire", "Dommel", "dxADSL", "EDPnet", "#Eleven:E-leven", "Euphony", "FullADSL", "HappyMany", "Mobistar", "Mobistariew:Mobistar Internet Everywhere", "Coditel:Numericable", "Scarlet", "Tele2", "Telenet", "Tvcablenet", "Voo",   
															"_France","Orange","iZi",
															"_Canada","#Videotron:Vidéotron",
															"_Czech Republic", "#Karneval", "#Chello", "#InternetExpres", "#Gtsnovera:GTS Novera",
															"_New Zealand", "Xtra",
															//"_Netherlands", "#Xs4all",
															"_Russia", "Omsk:Omsk TeleCommunications", //"#Stream",
															"_Turkey", "#Turk:Türk Telekom", 
															//"_England", "Bt",
															"_Australia", "Internode",
															"_South Africa", "#Saix:Saix ISPs", "#Mweb", "#Internetsolutions:Internet Solutions"//, "Iburst"
															);
															

		

    var minimeterprefs = null; 
    var credentials = null;
    var obj = null;
    
    function initialize_settings()
    {
    	fillProviders();
    	
			if(window.arguments != null){
      	obj = window.arguments[0];
      }

      var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService);
      minimeterprefs = prefService.getBranch("extensions.minimeter.");
      credentials = new Credentials("chrome://minimeter/");
      initOptions();
      document.getElementById("username").focus();
    }		
    
    function setOptions()
    {
      try{
          var username = document.getElementById("username").value;
          if(username == "") {
            alert(getString("error.emptyUsername"));
            return false;
          }
          
	    		var capacity = document.getElementById('capacity').value;
          
          if (!document.getElementById('provider').selectedItem.hasAttribute('capacity'))
            capacity = "10";
            
	    		if(document.getElementById('flatrate').checked && capacity == "") {
            if(capacity == "")
              capacity = 0;
          }
          else {
            capacity = capacity.replace(",",".");
            if(!parseFloat(capacity)){
              alert(getString("error.capacityDecimal"));
              return false;
              capacity = parseFloat(capacity);
            }
          }
					if(!document.getElementById('flatrate').checked && capacity <= 0){
						alert(getString("error.capacityNotZero"));
						return false;
					} 
          var provider = document.getElementById('provider')
	    		if(monitors[provider.selectedIndex][0] == "_"){
						alert(getString("error.ispCountry"));
						return false;
					}
					
          minimeterprefs.setIntPref("updateTimeout", 
              Math.round(document.getElementById('updateTimeout').value.replace(",",".")) * 60);
          minimeterprefs.setBoolPref("showtext", 
              document.getElementById('showtext').checked);
          minimeterprefs.setBoolPref("showmeter", 
              document.getElementById('showmeter').checked);
          minimeterprefs.setBoolPref("showicon", 
              document.getElementById('showicon').checked);
          minimeterprefs.setBoolPref("useSI", 
              document.getElementById('useSI').checked);
          minimeterprefs.setBoolPref("showRemainingDays", 
              document.getElementById('showRemainingDays').checked);
          minimeterprefs.setBoolPref("showAmountToPay", 
              document.getElementById('showAmountToPay').checked);
          minimeterprefs.setBoolPref("showRemainingAverage", 
              document.getElementById('showRemainingAverage').checked);
          minimeterprefs.setCharPref("provider", provider.value);
          minimeterprefs.setCharPref("capacitychar", capacity);
          minimeterprefs.setBoolPref("sendDebug", 
              document.getElementById('sendDebug').checked);
          minimeterprefs.setCharPref("textToReplace", textToReplace);
          credentials.store(
              username ,
              document.getElementById("password").value);  
          
          if(obj != null) {
          	obj.check();
          }

      }catch(e){
          alert(e); 
          return false;
      }
     
      return true; 
    }
    
    function initOptions()
    {
      sendDebug = minimeterprefs.getBoolPref('sendDebug');
      textToReplace = minimeterprefs.getCharPref('textToReplace');
    	updateTimeout = minimeterprefs.getIntPref('updateTimeout');
    	showtext = minimeterprefs.getBoolPref('showtext');
    	showmeter = minimeterprefs.getBoolPref('showmeter');
    	showicon = minimeterprefs.getBoolPref('showicon');
    	useSI = minimeterprefs.getBoolPref('useSI');
    	showRemainingDays = minimeterprefs.getBoolPref('showRemainingDays');
    	showAmountToPay = minimeterprefs.getBoolPref('showAmountToPay');
    	showRemainingAverage = minimeterprefs.getBoolPref('showRemainingAverage');
    	provider = minimeterprefs.getCharPref('provider');
      try {
        capacity = minimeterprefs.getIntPref('capacity');
        minimeterprefs.setCharPref('capacitychar',capacity);
        minimeterprefs.clearUserPref('capacity');
      }
      catch(e) {}
      
      capacity = minimeterprefs.getCharPref('capacitychar');
    	
      document.getElementById('sendDebug').checked = sendDebug;
      document.getElementById('textToReplace').value = textToReplace;
      document.getElementById('updateTimeout').value = updateTimeout /60;
      document.getElementById('showtext').checked = showtext;
      document.getElementById('showmeter').checked = showmeter;
      document.getElementById('showicon').checked = showicon;
      document.getElementById('useSI').checked = useSI;
      document.getElementById('showRemainingDays').checked = showRemainingDays;
      document.getElementById('showAmountToPay').checked = showAmountToPay;
      document.getElementById('showRemainingAverage').checked = showRemainingAverage;
      document.getElementById('provider').value = provider;
      

      if(capacity <= 0) setFlatrate(true); else {
      	
      	document.getElementById('capacity').value = capacity;

      }
      
      var user = credentials.load();
      document.getElementById("username").value=  user.username;
      document.getElementById("password").value=  user.password;
      
			updateForm();
    }
    
    function fillProviders(){
    	var list = document.getElementById("provider").getElementsByTagName("menupopup")[0];
    	for(i=0; i < monitors.length; i++){
    		m = monitors[i];
    		isp = document.createElement("menuitem");
    		if(m[0] == "_"){
    			isp.setAttribute( "class" , "menuitem-head");
	    		isp.setAttribute( "label" , m.substr(1));
	    		isp.setAttribute( "disabled" , "true");
    		} else {   
    			if(m[0] == "#"){
    				isp.setAttribute( "capacity" , true);
    				m = m.substr(1);
    			}
	    		ml = m.split(":")[0].toLowerCase();
	    				
	    		if(!m.split(":")[1]) m = m.split(":")[0]; else m = m.split(":")[1];
	    		isp.setAttribute( "label" , m);
	    		isp.setAttribute( "value" , ml);
	    		isp.setAttribute( "src" , "chrome://minimeter/content/res/" + ml + ".png"); // < Firefox 3
	    		isp.setAttribute( "image" , "chrome://minimeter/content/res/" + ml + ".png"); // >= Firefox 3
	    		isp.setAttribute( "style" , "background-image: url(chrome://minimeter/content/res/" + ml + ".png) !important");
    		}
    		list.appendChild(isp);
    	}
/*

    	var clist = document.getElementById("capacity").getElementsByTagName("menupopup")[0];
    	//var capacities = new Array(5, 10, 30, 50);
    	
    	for(i=2; i <= 30; i++){
    		isp = document.createElement("menuitem");
    		isp.setAttribute( "label" , i + " GB");
    		isp.setAttribute( "value" , i);
    		isp.setAttribute( "style" , "width: 20px !important; float:left; ");
    		clist.appendChild(isp);
    	}
    */	
    }
    
  	function updateForm(){
  		
  		extrafield = document.getElementById('provider').selectedItem.hasAttribute('capacity');
  		document.getElementById('capacityrow').setAttribute('hidden', !extrafield );
  		if(!extrafield){
  			document.getElementById('flatratedesc').hidden = true;
  		} else {
  			setFlatrate (document.getElementById('flatrate').checked );
  		}
  	}
  	

	function setFlatrate(val){
		capacity = minimeterprefs.getCharPref('capacitychar');
		
		var field = document.getElementById('capacity');
		if(val) field.setAttribute("disabled", true); else field.removeAttribute("disabled");
		if(val) field.value = ""; else field.value = capacity;
		document.getElementById('flatrate').checked = val;
		if(val)
      document.getElementById('showmeter').checked = !val;
	
		document.getElementById('flatratedesc').hidden = !val;
	}
	
function moreInfo() {
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  var nsIWM = Cc["@mozilla.org/appshell/window-mediator;1"]
              .getService(Ci.nsIWindowMediator);
  var myWindow = nsIWM.getMostRecentWindow("navigator:browser");
  var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);
  var browserprefs = prefService.getBranch("general.useragent.");
  var locale = browserprefs.getCharPref('locale');
  var url;
  if (locale == "fr")
    url = "http://extensions.geckozone.org/Minimeter#correction";
  else
    url = "http://extensions.geckozone.org/Minimeter-en#correction";
  
  if (myWindow) {
    var newTab = myWindow.getBrowser().addTab(url);
    myWindow.getBrowser().selectedTab = newTab;
    //myWindow.content.focus();
  } else {
    window.opener.open(url);
  }
  window.self.focus();
}
