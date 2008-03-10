function Videotron(username, password) {
    this.username = username;
    this.password = "vide";
    this.image = "videotron.png"; // does not belong in class
    this.name = "Vidéotron";
    this.url = "https://www.videotron.com/services/secur/ConsommationInternet.do?compteInternet="+this.username;
}

Videotron.prototype = new Monitor();

Videotron.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
          http_get("https://www.videotron.com/services/secur/ConsommationInternet.do?compteInternet="+this.username, this, 2);
          break;
          
       case 2:
         reply = unescape(reply);
         var regDateAndUsed = /<tbody>\s*<tr>\s*<td nowrap="nowrap">([0-9]*)-([0-9]*)-([0-9]*) (au|to)<br \/>[0-9-]*<\/td>\s*<td width="10"><\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td><\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>/;
        
         if(!regDateAndUsed.test(reply)){
           var regErrorLogin=/Assurez-vous d'avoir bien inscrit votre nom d'utilisateur Internet/;
           if (regErrorLogin.test(reply)) {
             this.badLoginOrPass();
             break;
           }
           else {
             this.reportError();
             break;
           }
         } 
         else {
           var volumeused = 0;
            
           volumeused = regDateAndUsed.exec(reply);

           this.usedVolume = Math.round((volumeused[5] /1024)*1000)/1000;
           this.totalVolume = this.getCapacity();
         }
         this.remainingDays = getInterval(volumeused[3]+"/"+volumeused[2]+"/"+volumeused[1]);
         this.update(true);
    }
}

