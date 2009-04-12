
//http://www.mobistar.be/fr/e-services/page/myac_myab_type3
function Mobistariew(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "mobistariew.png";
    this.name = "Mobistar Internet Everywhere";
    this.url = "https://www.mobistar.be/fr/e-services/page/myac_mybu_type2/09_ApplicationInformation/01_Descriptions/info_conso_iew_logged.xml";
	this.hsdpaAboTypeMax = false;
}

Mobistariew.prototype = new Monitor();

Mobistariew.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "portlet_login_6%7BactionForm.login%7D="+this.username+"&portlet_login_6%7BactionForm.password%7D="+this.password;
        http_post('https://www.mobistar.be/www/portal/public/residential?_nfpb=true&portlet_login_6_actionOverride=%2Fbe%2Fmobistar%2Fim%2Fprocess%2Fportlets%2Flogin001%2FprocessLogin&_windowLabel=portlet_login_6&_pageLabel=applicationAuthentication', postdata,this, 2);
				break;
				
      case 2:
        reply = decodeURIComponent(reply);
        var regLangNotChosen=/images\/languagep.jpg/;
        if (regLangNotChosen.test(reply)) {
          http_get("http://www.mobistar.be/www/portal/public/residential?_nfpb=true&_pageLabel=guesthome&language=fr_BE&event=languageEvent", this, 1);
          break;
        }
        var regLoginok=/(Bienvenue|Welkom)/;
        if (!regLoginok.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get("https://partners.mobistar.be/selfcare/?lg=fr", this, 3);
        break;
		
      case 3:
        var regGetTypeAbbo =/Mobistar Internet Everywhere Max/;
        reply = decodeURIComponent(reply);
        if(regGetTypeAbbo.test(reply)) {
         this.hsdpaAboTypeMax = true;
        } 
        http_get("http://partners.mobistar.be/conso-iew-logged/index.cfm?lg=FR", this, 4);
        break;
		
      case 4:
        var regUsedMB=/jours et consomm&eacute; <strong>\s*([0-9.]*) MB/;
        var regUsedGB=/jours et consomm&eacute; <strong>\s*([0-9.]*) GB/;
        var regUsedExceeded =/<strong>([0-9.]*) GB<\/strong>/;
        var regAmountToPay=/<strong>([0-9.]*)[\w&;]*EUR<\/strong>/;
        var regAllowed=/abonnement Internet Everywhere est de <strong>\s*([0-9.]*) MB/;
        var regDateEnd=/(avant le) ([0-9]*) /; // avant le (15) Janvier 2009
        var regServerError=/en cours de maintenance/;
        var regNbDayUsed=/votre Internet Everywhere <strong>([0-9]*)<\/strong> jours et/;
        var regdataInRoaming=/tranger\: <strong>\s*([0-9.]*)\s*MB<\/strong>/; //Oula ca va couter cher
        reply = decodeURIComponent(reply);
        if((!regUsedMB.test(reply) && !regUsedGB.test(reply) && !regUsedExceeded.test(reply)) || !regAllowed.test(reply) || !regNbDayUsed.test(reply) || !regdataInRoaming.test(reply)){
          if (regServerError.test(reply))
            this.error = "server";
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var volumeUsed, volumeAllowed, dateEnd, month, amountToPay;
        if(regUsedMB.test(reply)) {
          volumeUsed = regUsedMB.exec(reply);
          volumeUsed =  Math.round(volumeUsed[1]/1024*1000) /1000;
        }
        else
          if(regUsedGB.test(reply)){
            volumeUsed = regUsedGB.exec(reply);
            volumeUsed = volumeUsed[1];
          }
          else {
            volumeUsed = regUsedExceeded.exec(reply);
            volumeUsed = volumeUsed[1];
          }
        //volumeUsed = 5; //Volume forcé pour test
        
        if(isUseSI()) {
          var isSiGbValue = getString("unitSI.GiB");
          var ifSiMbValue = getString("unitSI.MiB");
        } else {
          var isSiGbValue = getString("unit.GB");
          var ifSiMbValue = getString("unit.MB");
        }
    
        var volumeAllowed = regAllowed.exec(reply);
        this.usedVolume = volumeUsed*1;
        this.totalVolume = volumeAllowed[1]/1024; //Mobistar passe leurs compteurs de GB a MB
        
        if(regDateEnd.test(reply)) {
          dateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", dateEnd[2]);
        }
    
        var nbDayConnected = regNbDayUsed.exec(reply);
        nbDayConnected = nbDayConnected[1];
        
        var nbDataWhenRoaming = regdataInRoaming.exec(reply);
        nbDataWhenRoaming = nbDataWhenRoaming[1];
        //nbDataWhenRoaming = 120; //Debug pour roaming
        var extraMsgRoamingInfo = "";
        var extraPrixMsgRoamingInfo = "";
        if(nbDataWhenRoaming != "0.00") {
          extraMsgRoamingInfo = "\n       "+nbDataWhenRoaming+" "+ifSiMbValue+" "+getString("info.MIEWInRoaming");
          extraPrixMsgRoamingInfo = "("+getString("info.plusRoamingDataInPrice")+")";
        }
        
        //On va calculer les suppléments.
        var calculGbsupplement = (volumeUsed - this.totalVolume) * 1024;
        var supplementCalculMbEuros = 0;
        if(calculGbsupplement >= 0) {
          supplementCalculMbEuros = 0.03 * calculGbsupplement; //3Cent fois le nombre de mb supl
        }
        
        var stringAtReturnIfIEW = "";
        var valueAbonnementIewPrix = 0;
        if(!this.hsdpaAboTypeMax) {
          //stringAtReturnIfIEW = "(+"+ nbDayConnected+" EUR)"; //Affiche la somme due aux nb de jours de connexion
          valueAbonnementIewPrix = parseFloat(nbDayConnected) + supplementCalculMbEuros; //5€ + 1€/jours + quotas supl
        } else {
          valueAbonnementIewPrix = supplementCalculMbEuros;
        }
        if(valueAbonnementIewPrix > 0) {
          this.amountToPay = valueAbonnementIewPrix + " EUR";
        }
        
        this.extraMessage = "       "+ nbDayConnected + " "+getString("info.MIEWNbDayConnect")+" "+stringAtReturnIfIEW+" " + extraMsgRoamingInfo + extraPrixMsgRoamingInfo;
          
        this.update(true);
		}
}
