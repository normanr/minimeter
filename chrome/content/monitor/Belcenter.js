function Belcenter(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "belcenter.png"; // does not belong in class
    this.name = "Belcenter";
    this.url = "https://secure.belcenter.com/Adsl.FrontEnd.FR/My.Adsl/";
}

// corriger aussi Eleven

Belcenter.prototype = new Monitor();

Belcenter.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
          var postdata = "login="+this.username+"&password="+this.password+"&B1=Envoyer&server=smtp.belcenter.com&port=143&maildomain=belcenter.com&protocol=imap&mailbox=INBOX&redirect_url=&actionID=105&realm=belcenter.com&new_lang=fr_FR&imapuser=USERNAME&pass=PASSWORD";
          http_post(this.url, postdata,this, 2);
          break;
          
       case 2:
         reply = decodeURIComponent(reply);
         var regQuota = /<b> ([0-9.]*)GB <\/font><\/b> sur ([0-9]*) GB disponibles/;
         var regSupp = /Provision restante<\/b> : <b>([0-9.]*)GB<\/b>/;
        
         if(!regQuota.test(reply)){
           var regErrorLogin=/Erreur de login ou de mot de passe/;
           if (regErrorLogin.test(reply)) {
             this.badLoginOrPass();
             break;
           }
           else {
             this.reportError(step, this.name, encodeURIComponent(reply));
             break;
           }
         } 
         else {
        
            var volumeQuota = 0;
            var volumeTotal = 0;
            var volumeSupp = 0;
            
            volumeQuota = regQuota.exec(reply);
            
            if(regSupp.test(reply)){
              volumeSupp = regSupp.exec(reply);
              volumeTotal = volumeSupp[1]*1;
            }
             this.usedVolume = volumeQuota[1];
             this.totalVolume = volumeTotal + (volumeQuota[2]*1);
             this.remainingDays = getInterval("firstDayNextMonth");
             this.update(true);
         }
    }
}
