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
         var regDateAndUsed = /Go<\/center><\/b><\/td>\s*<\/tr>\s*<tr>\s*<td bgcolor="#FFFFFF" class="reg">([0-9]*)-([0-9]*)-([0-9]*) au [0-9-]*<\/td>\s*<td bgcolor="#FFFFFF" align="right" valign="top" class="reg">([0-9.]*)<\/td>/;
        
         if(!regDateAndUsed.test(reply)){
           var regErrorLogin=/Assurez-vous d'avoir bien inscrit votre nom d'utilisateur Internet/;
           if (regErrorLogin.test(reply)) {
             this.badLoginOrPass();
             break;
           }
           else {
             this.unknownError(step,this.name);
             break;
           }
         } 
         else {
           var volumeused = 0;
            
           volumeused = regDateAndUsed.exec(reply);

           this.usedVolume = Math.round((volumeused[4] /1024)*1000)/1000;
           this.totalVolume = this.getCapacity();
         }
         this.remaining = getInterval(volumeused[3]+"/"+volumeused[2]+"/"+volumeused[1]);
         this.update(true);
    }
}

