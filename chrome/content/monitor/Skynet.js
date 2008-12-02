function Skynet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "skynet.png"; // does not belong in class
    this.name = "Belgacom";
    this.url = "https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume";
}

Skynet.prototype = new Monitor();

Skynet.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
         this.extraMessage = '';
         var postdata = "login-form-type=pwd&username="+this.username+"&password="+this.password;
         http_post('https://admit.belgacom.be/pkmslogin.form', postdata,this, 2);
         break;
       case 2:
         reply = unescape(reply);
         var regErrorLogin = /HPDIA0200W   Authen/;
         if (regErrorLogin.test(reply))
           this.tryAgain("oldMethod");
         else {
          http_get("https://admit.belgacom.be/eservices/wps/myportal/my_internet?pageChanged=true", this, 3);
         }
         break;
         
       case "oldMethod":
         this.url = "https://e-care.skynet.be/index.cfm?function=connection.getVolume";
         var postdata = "fuseaction=CheckLoginConnection&form_login="+this.username+"&form_password="+this.password+"&Langue_Id=3&Submit=Connexion";
         http_post('https://e-care.skynet.be/index.cfm?function=connection.getVolume', postdata,this, 4);
         break;
         
       case 3:
         reply = unescape(reply);
         var regAdrQuota = /function%3Dconnection.getVolume!26farg.login%3D([0-9a-z]*)!26farg.login_type%3Dconnection!26farg.sso_date%3D([0-9]*)!26farg.type%3D([0-9])!26farg.key%3D([0-9A-Z#_]*)">(Consulter le volume mensuel|Het maandelijkse volume raadplegen|Consult monthly volume)<\/a><\/div>/;
         if(!regAdrQuota.test(reply)) {
           this.reportError(step, this.name, escape(reply));
         }
         else {
           var adrQuota = regAdrQuota.exec(reply);
           http_get("https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume&farg.login="+adrQuota[1]+"&farg.login_type=connection&farg.sso_date="+adrQuota[2]+"&farg.type="+adrQuota[3]+"&farg.key="+adrQuota[4], this, 4);
         }
         
         break;
       case 4:
         reply = unescape(reply);
         var regmb = /(Volume mensuel utilis[&eacute;È√©]*|Gebruikt volume voor deze maand|Monthly volume used)\s*<strong>([0-9]+) MB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(4)
         var reggb = /(Volume mensuel utilis[&eacute;È√©]*|Gebruikt volume voor deze maand|Monthly volume used)\s*<strong>([0-9]*) GB ([0-9]+) MB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(3),3(5)
         var reggbl = /(Volume mensuel utilis[&eacute;È√©]*|Gebruikt volume voor deze maand|Monthly volume used)\s*<strong>([0-9]*) GB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(4)

         var reggbv = /(du Volume Pack en cours :|Gebruikt volume voor het lopende Volume Pack|You used)\s*<strong>([0-9]*) GB ([0-9]+) MB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(3),3(5)
         var regmbv = /(du Volume Pack en cours :|Gebruikt volume voor het lopende Volume Pack|You used)\s*<strong>([0-9]+) MB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(4)
         var reggblv = /(du Volume Pack en cours :|Gebruikt volume voor het lopende Volume Pack|You used)\s*<strong>([0-9]*) GB<\/strong>\s*(sur|van de beschikbare|out of)\s*<strong>(.*) GB<\/strong>/;// 1(2),2(4)

         var regvps = /(De plus, vous disposez encore de|Bovendien heeft u nog recht op|Moreover, you still have)\s*<strong>([0-9]*)<\/strong>\s*(Volume Pack\(s\) inutilis[&eacute;È√©]*\(s\)|niet gebruikt|unused Volume Pack\(s\))/;// 1(2)
         
         if( !reggb.test(reply) && !regmb.test(reply) && !reggbl.test(reply) ){
           this.url = "https://admit.belgacom.be/SKY_ECE/index.cfm?function=connection.getVolume";
           this.badLoginOrPass("belgacom"); // pendant la transition vers les e-Services
           break;
         }
         else {
        
          var volume = null;
          var volumepack = null;
          var volumeused = 0;
          var volumetotal = 0;
          var currentVpUse = 0;
          var VPSize = 0;
          var nbofVPShowed = 0;
          
          if(regvps.test(reply)){
          nbofVPShowed = regvps.exec(reply);
          nbofVPShowed = (nbofVPShowed[2]*1);
          }

            if(reggbv.test(reply)){
              volumepack = reggbv.exec(reply);
              currentVpUse = ((volumepack[2]*1024) + (volumepack[3]*1)) / 1024; 
              VPSize = volumepack[5];
              nbofVPShowed++;
           }else if(regmbv.test(reply)){
              volumepack = regmbv.exec(reply);
              currentVpUse = (volumepack[2] / 1024);
              VPSize = volumepack[4];
              nbofVPShowed++;
           }else if(reggblv.test(reply)){
              volumepack = reggblv.exec(reply);
              currentVpUse = volumepack[2];
              VPSize = volumepack[4];
              nbofVPShowed++;
           }

            if(reggb.test(reply)){
              volume = reggb.exec(reply);
              volumeused = (volume[2]*1) + (volume[3] / 1024);
              volumetotal = volume[5];
           }else if(regmb.test(reply)){
              volume = regmb.exec(reply);
              volumeused = (volume[2] / 1024);
              volumetotal = volume[4];
           }else if(reggbl.test(reply)){
              volume = reggbl.exec(reply);
              volumeused = volume[2];
              volumetotal = volume[4];
           }
           
           
            var belgacomVP
            try {belgacomVP = minimeterprefs.getCharPref('belgacomVP');} catch(e){belgacomVP = "-1;0;0;0;0;0"};// lastUpdateMonth;totalVP;lastShowedVP;boughtLastMonth;lastCurrentVPUsedState;VPSizeSaved
            var nowMonth = new Date();
            nowMonth = nowMonth.getMonth();
            belgacomVP = belgacomVP.split(";");
            
            if(belgacomVP[0] != -1 && belgacomVP[0] == nowMonth) {
              if(nbofVPShowed >= belgacomVP[2]) {
                belgacomVP[1] = belgacomVP[1]*1 + nbofVPShowed - belgacomVP[2];
                if(belgacomVP[4]>currentVpUse)
                  belgacomVP[1]++; //volume pack bought and the previous one exhausted simultaneously
              }
              belgacomVP[2] = nbofVPShowed;
            }
            else {
              belgacomVP[0] = nowMonth;
              belgacomVP[1] = nbofVPShowed;
              belgacomVP[2] = nbofVPShowed;
              belgacomVP[3] = nbofVPShowed;
            }
            belgacomVP[4] = currentVpUse;
            
            if(VPSize!=0 || belgacomVP[5]==null)
              belgacomVP[5]=VPSize;
            else
              VPSize=belgacomVP[5];
            
            minimeterprefs.setCharPref('belgacomVP', belgacomVP.join(";"));


           this.usedVolume = volumeused*1 + currentVpUse*1 + VPSize*(belgacomVP[1] - nbofVPShowed);
           this.totalVolume = volumetotal*1 + VPSize*belgacomVP[1];
             
           this.remainingDays = getInterval("firstDayNextMonth");
           var numberOfVPBought = belgacomVP[1] - belgacomVP[3];
           if(numberOfVPBought>0)
            this.amountToPay = numberOfVPBought*5 + " EUR (" + numberOfVPBought +" volume pack"+(numberOfVPBought>1?"s)":")");
           this.update(true);
            }

    }

}

