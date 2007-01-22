function Skynet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "skynet.png"; // does not belong in class
    this.name = "Skynet ADSL";
    this.url = "https://e-care.skynet.be/index.cfm?function=connection.getVolume"
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
            var postdata = "fuseaction=CheckLoginConnection&form_login="+this.username+"&form_password="+this.password+"&Langue_Id=3&Submit=Connexion";
            http_post('https://e-care.skynet.be/index.cfm?function=connection.getVolume&language=fr', postdata,this, 2);

            break;
         case 2:
           reply = unescape(reply);
           var regmb = /Volume mensuel utilis&eacute;\s*<strong>([0-9]+) MB<\/strong>\s*sur\s*<strong>(.*) GB<\/strong>/;
           var reggb = /Volume mensuel utilis&eacute;\s*<strong>([0-9]*) GB ([0-9]+) MB<\/strong>\s*sur\s*<strong>(.*) GB<\/strong>/;
           var reggbl = /Volume mensuel utilis&eacute;\s*<strong>([0-9]*) GB<\/strong>\s*sur\s*<strong>(.*) GB<\/strong>/;

           var regmbv = /du Volume Pack en cours :\s*<strong>([0-9]+) MB<\/strong>\s*sur\s*<strong>(.*) GB<\/strong>/;
           var reggbv = /du Volume Pack en cours :\s*<strong>([0-9]*) GB ([0-9]+) MB<\/strong>\s*sur\s*<strong>(.*) GB<\/strong>/;
           var reggblv = /du Volume Pack en cours :\s*<strong>([0-9]*) GB<\/strong>\s*sur\s*<strong>(.*) GB<\/strong>/;

           var regvps = /De plus, vous disposez encore de\s*<strong>([0-9]*)<\/strong>\s*Volume Pack(s) inutilis&eacute;(s)/;
          
           if( !reggb.test(reply) && !regmb.test(reply) && !reggbl.test(reply) ){
               this.notLoggedin();
           } else {
          
            var volume = null;
            var volumepack = null;
            var volumeused = 0;
            var volumetotal = 0;
            var volumepackused = 0;
            var volumepacktotal = 0;
            var volumepackmulti = 1;
            
            if(regvps.test(reply)){
            volumepackmulti = regvps.exec(reply);
            volumepackmulti = (volumepackmulti[1]*1) + (1*1);
            }

              if(reggbv.test(reply)){
                volumepack = reggbv.exec(reply);
                volumepackused = ((volumepack[1]*1000) + (volumepack[2]*1)) / 1000; 
                volumepacktotal = volumepack[3];
             }else if(regmbv.test(reply)){
                volumepack = regmbv.exec(reply);
                volumepackused = (volumepack[1] / 1000);
                volumepacktotal = volumepack[2];
             }else if(reggblv.test(reply)){
                volumepack = reggblv.exec(reply);
                volumepackused = volumepack[1];
                volumepacktotal = volumepack[2];
             }

              if(reggb.test(reply)){
                volume = reggb.exec(reply);
                volumeused = (volume[1]*1) + (volume[2] / 1000);
                volumetotal = volume[3];
             }else if(regmb.test(reply)){
                volume = regmb.exec(reply);
                volumeused = (volume[1] / 1000);
                volumetotal = volume[2];
             }else if(reggbl.test(reply)){
                volume = reggbl.exec(reply);
                volumeused = volume[1];
                volumetotal = volume[2];
             }

         //case main volume limit is reached and a volumepack is actually used :
         //only the volumepack values are shown
             if (volumeused == volumetotal && volumepacktotal != 0){
             this.usedVolume = volumeused*1 + volumepackused*1;
             this.totalVolume = volumetotal*1 + (volumepacktotal*volumepackmulti);
         //for others cases : main volume is gived + eventual volumepack's of previous month
             }else{
             this.usedVolume = Math.round((volumeused*1000) + (volumepackused*1000))/1000; 
             this.totalVolume = (volumetotal*1) + (volumepacktotal*volumepackmulti);
             }
                   this.update(true);
              }
               
      }   
            
}

