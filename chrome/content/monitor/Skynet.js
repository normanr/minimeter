Minimeter.Skynet = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "skynet.png"; // does not belong in class
    this.name = "Belgacom";
    this.url = "https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume";
    this.BgErrLoginEservices = false;
    this.priceToPay = 0;
    this.totalVolOfVPBought = 0;
    this.nbOfVPBought = 0;
}

Minimeter["Skynet"].prototype = new Minimeter.Monitor();

Minimeter["Skynet"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        this.priceToPay = 0;
        this.totalVolOfVPBought = 0;
        this.nbOfVPBought = 0;
        this.extraMessage = '';
        var postdata = "login-form-type=pwd&username="+this.username+"&password="+this.password;
        Minimeter.http_post('https://admit.belgacom.be/pkmslogin.form', postdata,this, 2);
        break;
        
      case 2:
        var reply = decodeURIComponent(reply);
        this.BgErrLoginEservices = false;
        var regErrorLogin = /HPDIA0200W   Authen/;
        var regRedirection = /location='YPA\/ypa/; // vÈrifie qu'aucune erreur n'est indiquÈe
        if (regErrorLogin.test(reply)) {
          this.BgErrLoginEservices = true;
          this.tryAgain("oldMethod");
          break;
        }
        if (!regRedirection.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        Minimeter.http_get("https://admit.belgacom.be/eservices/wps/myportal/my_internet?pageChanged=true", this, 3);
        break;
        
      case "oldMethod":
        this.url = "https://admit.belgacom.be/ecare-slf/index.cfm?function=connection.getVolume";
        var postdata = "fuseaction=CheckLoginConnection&form_login="+this.username+"&form_password="+this.password+"&Langue_Id=3&Submit=Connexion";
        Minimeter.http_post('https://admit.belgacom.be/ecare-slf/index.cfm?function=connection.getVolume', postdata,this, 4);
        break;
        
      case 3:
        var reply = decodeURIComponent(reply);
        var regAdrQuota = /function%3[dD]connection.getVolume!26farg.login%3[dD]([0-9a-z]*)!26farg.login_type%3[dD]connection!26farg.sso_date%3[dD]([0-9]*)!26farg.type%3[dD]([0-9])!26farg.key%3[dD]([0-9A-Z#_]*)">(Consulter le volume mensuel|Het maandelijkse volume raadplegen|Consult monthly volume)<\/a><\/div>/;
        var regNoConnectionLinked = /no Internet connection account linked|Aucun compte de connexion Internet|geen enkele internetaccount gelinkt|Ajouter une connexion Internet|Add an Account|Een Internetverbinding toevoegen/;
        var changePassword = /and choose a new personal password/;
        var regServerError = /Une erreur est survenue|An error occured|technical problem|Les e-Services ne sont pas disponibles|De e-Services zijn niet beschikbaar|The e-Services are unavailable/;

        if(!regAdrQuota.test(reply)) {
          if(regNoConnectionLinked.test(reply))
            this.noConnectionLinked();
          else {
						var backToTheHomepageFromAdvantage = /<a href="(\/eservices\/wps\/myportal\/!ut\/p\/kcxml\/[0-9a-zA-Z_\-!]*\/delta\/base64xml\/[^\.]*!2fgoBackToHomepage.do)/;
					
						if (backToTheHomepageFromAdvantage.test(reply)) { // is the advantages page shown ?
							var adrBackLink = backToTheHomepageFromAdvantage.exec(reply);
							Minimeter.http_get("https://admit.belgacom.be/" + adrBackLink[1], this, 3);
						}
						else
              if (changePassword.test(reply))
                this.userActionRequired();
              else {
                if (regServerError.test(reply))
                  this.error = "server";
                this.reportError(step, this.name, encodeURIComponent(reply));
              }
          }
        }
        else {
          var adrQuota = regAdrQuota.exec(reply);
          //Minimeter.http_get("https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume&farg.login="+adrQuota[1]+"&farg.login_type=connection&farg.sso_date="+adrQuota[2]+"&farg.type="+adrQuota[3]+"&farg.key="+adrQuota[4], this, 4);
          Minimeter.http_get("https://admit.belgacom.be/SKY_ECE/index.cfm?function=customer.overview&farg.prod_type=vp&farg.login="+adrQuota[1]+"&farg.login_type=connection&farg.sso_date="+adrQuota[2]+"&farg.type="+adrQuota[3]+"&farg.key="+adrQuota[4], this, 4);
        }
        
        break;
        
		
      case 4:
        var reply = decodeURIComponent(reply);
        var ladate = new Date();
        var lemois = ladate.getMonth() + 1;
        var re = new RegExp('<span class="topInfoLine"><strong>Internet ([0-9]*)G volume pack&nbsp;</strong></span><br>\\s*</td>\\s*<td width="1" background="pics/vert_dotted_ln.gif"><img src="pics/spacer.gif" width="1" height="1"></td>\\s*<td align="center" valign="middle" width="100" style="padding:10px;">\\s*<span class="topInfoLine"><strong>[0-9]*/[0]?'+lemois+'/'+ladate.getFullYear()+'</strong></span>',"g");
        if (re.test(reply)) {
          var sizeofVPbought;
          re.lastIndex = 0;
          while (sizeofVPbought = re.exec(reply)) {
            sizeofVPbought = sizeofVPbought[1];
            this.nbOfVPBought ++;
            if (sizeofVPbought == 20)
              this.priceToPay += 5;
            else
              if (sizeofVPbought == 1)
                this.priceToPay += 1;
              else
                this.reportError(step, this.name, encodeURIComponent(reply));
            this.totalVolOfVPBought += sizeofVPbought * 1;
            //Minimeter.consoleDump(sizeofVPbought);
          }
        }
        Minimeter.http_get("https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume", this, 5);
        
        break;

      case 5:
        var reply = decodeURIComponent(reply);
        var regmb = /(Volume mensuel utilis[&eacute;È√©]*|Gebruikt volume voor deze maand|Monthly volume used)\s*<strong>([0-9]+) MB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(4)
        var reggb = /(Volume mensuel utilis[&eacute;È√©]*|Gebruikt volume voor deze maand|Monthly volume used)\s*<strong>([0-9]*) GB ([0-9]+) MB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(3),3(5)
        var reggbl = /(Volume mensuel utilis[&eacute;È√©]*|Gebruikt volume voor deze maand|Monthly volume used)\s*<strong>([0-9]*) GB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(4)

		
		//<strong>1 GB 180 MB</strong> d'extra volume disponible de vos volume packs
        var reggbv = /<strong>([0-9]*) GB ([0-9]+) MB<\/strong>\s*(?:d'extra volume|extra volume|of extra volume)/;// 1(2),2(3),3(5)
        var regmbv = /<strong>([0-9]+) MB<\/strong>\s*(?:d'extra volume|extra volume|of extra volume)/;// 1(2),2(4)
        var reggblv = /<strong>([0-9]*) GB<\/strong>\s*(?:d'extra volume|extra volume|of extra volume)/;// 1(2),2(4)

        //var regvps = /(De plus, vous disposez encore de|Bovendien heeft u nog recht op|Moreover, you still have)\s*<strong>([0-9]*)<\/strong>\s*(Volume Pack\(s\) inutilis[&eacute;È√©]*\(s\)|niet gebruikt|unused Volume Pack\(s\))/;// 1(2)
        
        if( !reggb.test(reply) && !regmb.test(reply) && !reggbl.test(reply) ){
          this.url = "https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume";
          if (this.BgErrLoginEservices)
            this.badLoginOrPass("belgacom"); // pendant la transition vers les e-Services
          else
            this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        else {
          var volume = null;
          var volumepack = null;
          var volumeused = 0;
          var volumetotal = 0;
          var remainOfVpUse = 0;
          var volUsedOfVP = 0;
          var volSuppFromVP = 0;
         
          /*if(regvps.test(reply)){
            nbofVPShowed = regvps.exec(reply);
            nbofVPShowed = (nbofVPShowed[2]*1);
          }*/
         
          if(reggbv.test(reply)){
            volumepack = reggbv.exec(reply);
            remainOfVpUse = ((volumepack[1]*1000) + (volumepack[2]*1)) / 1000; 
          }else if(regmbv.test(reply)){
             volumepack = regmbv.exec(reply);
             remainOfVpUse = (volumepack[1] / 1000);
          }else if(reggblv.test(reply)){
             volumepack = reggblv.exec(reply);
             remainOfVpUse = volumepack[1];
          }

          if(reggb.test(reply)){
            volume = reggb.exec(reply);
            volumeused = (volume[2]*1) + (volume[3] / 1000);
            volumetotal = volume[5];
          }else if(regmb.test(reply)){
             volume = regmb.exec(reply);
             volumeused = (volume[2] / 1000);
             volumetotal = volume[4];
          }else if(reggbl.test(reply)){
             volume = reggbl.exec(reply);
             volumeused = volume[2];
             volumetotal = volume[4];
          }
          
          volUsedOfVP = this.totalVolOfVPBought - remainOfVpUse;
          if (volUsedOfVP < 0) {
            volSuppFromVP = Math.ceil(remainOfVpUse);
            volUsedOfVP = volSuppFromVP - remainOfVpUse;
          }
          else
            volSuppFromVP = this.totalVolOfVPBought;
           
          this.usedVolume = volumeused*1 + volUsedOfVP*1;
          this.totalVolume = volumetotal*1 + volSuppFromVP*1;
         
          this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
          if(this.priceToPay>0)
            this.amountToPay = this.priceToPay + " EUR (" + this.nbOfVPBought +" volume pack"+(this.nbOfVPBought>1?"s)":")");
          this.update(true);
        }

    }

}

