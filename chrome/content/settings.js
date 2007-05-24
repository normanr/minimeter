		/*
			"Classname:Realname"
			_ = country
			# = custom capacity
		*/
		var monitors = new Array(	"_Belgium", "Belcenter", "Skynet:Belgacom ADSL", "#Chellobe:Chello", "Dommel", "#Edpnet:EDPnet", "Fulladsl:Full ADSL","Scarlet","Telenet", "Tvcablenet",   
															"_France","Orange",
															"_Canada","#Videotron:Vidéotron",
															"_Czech Republic", "#Karneval","#Chello","#InternetExpres",
															"_New Zealand", "Xtra",
															//"_Netherlands", "#Xs4all",
															"_Russia", "Omsk:Omsk TeleCommunications", //"#Stream",
															"_Turkey", "#Turk:Turk Telekom", 
															//"_England", "Bt",
															"_Australia", "Internode",
															"_South Africa", "#Saix:Saix ISPs", "#Mweb"//, "Iburst"
															);
															

		

    var prefs = null; 
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
      prefs = prefService.getBranch("extensions.minimeter.");
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

	    		if(document.getElementById('flatrate').checked && capacity == ""){
	    			capacity = 0;
	    		}
	    		
	    		if(!isInteger(capacity)){
						alert(getString("error.capacityDecimal"));
						return false;
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
					
          prefs.setBoolPref("click_check", 
              document.getElementById('click_check').checked);
          prefs.setBoolPref("showtext", 
              document.getElementById('showtext').checked);
          prefs.setBoolPref("showmeter", 
              document.getElementById('showmeter').checked);
          prefs.setBoolPref("useSI", 
              document.getElementById('useSI').checked);
          prefs.setCharPref("provider", provider.value);
          prefs.setIntPref("capacity", capacity);      
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
    	try{ click_check = prefs.getBoolPref('click_check'); } catch(ex) { click_check = false; }
    	try{ showtext = prefs.getBoolPref('showtext'); } catch(ex) { showtext = true; }
    	try{ showmeter = prefs.getBoolPref('showmeter'); } catch(ex) { showmeter = false; }
    	try{ useSI = prefs.getBoolPref('useSI'); } catch(ex) { useSI = true; }
    	try{ provider = prefs.getCharPref('provider'); } catch(ex) { provider = "skynet"; }
    	try{ capacity = prefs.getIntPref('capacity'); } catch(ex) { capacity = 10; }
    	
      document.getElementById('click_check').checked = click_check;
      document.getElementById('showtext').checked = showtext;
      document.getElementById('showmeter').checked = showmeter;
      document.getElementById('useSI').checked = useSI;
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
	    		isp.setAttribute( "src" , "chrome://minimeter/content/res/" + ml + ".png");
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
  	
  	
	function isInteger(value) {
  		return (parseInt(value) == value);
	}
	
	function setFlatrate(val){
		try{ capacity = prefs.getIntPref('capacity'); } catch(ex) { capacity = 10; }
		
		var field = document.getElementById('capacity');
		if(val) field.setAttribute("disabled", true); else field.removeAttribute("disabled");
		if(val) field.value = ""; else field.value = capacity;
		document.getElementById('flatrate').checked = val;
	
		document.getElementById('flatratedesc').hidden = !val;
	}