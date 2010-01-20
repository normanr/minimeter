Minimeter.Videotron = function(username, password) {
    this.username = username;
    this.password = "vide";
    this.image = "videotron.png"; // does not belong in class
    this.name = "Vidéotron";
    this.url = "https://www.videotron.com/services/secur/ConsommationInternet.do?compteInternet="+this.username;
}

Minimeter["Videotron"].prototype = new Minimeter.Monitor();

Minimeter["Videotron"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "compteInternet=" + this.username;
        Minimeter.http_post("https://www.videotron.com/services/secur/fr/votre_compte/StartTransaction.jsp", postdata,this, 2);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regDateAndUsed = /<tbody>\s*<tr>\s*<td nowrap="nowrap">([0-9]*)-([0-9]*)-([0-9]*) (au|to)<br \/>[0-9-]*<\/td>\s*<td width="10"><\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td><\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>/;
        
        if(!regDateAndUsed.test(reply)){
          var regErrorLogin = /Assurez-vous d'avoir bien inscrit votre nom d'utilisateur Internet|Beware to enter your Internet username correctly/;
          var regErrorServer = /ne sont pas disponibles|is not available|indisponible/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
            break;
          }
          else {
            if (regErrorServer.test(reply))
              this.error = "server";
            this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }
        }
        else {
          var volumeused = 0;
           
          volumeused = regDateAndUsed.exec(reply);
          this.totalVolume = this.getCapacity();
          
          this.extraMessage = "";
          
          this.usedVolume = volumeused[7];
          
          if (this.totalVolume == 30) { // jusqu'en mars 2010, pour les connexions datant d'avant mars 2009
            var gb = " " + Minimeter.getunitPrefix("GB"); // Unit as selected in options and locale
            var upload = Math.round(volumeused[6]/1024*1000)/1000;
            var download = Math.round(volumeused[5]/1024*1000)/1000;
            this.extraMessage = "       Upload : "+ upload.toString().replace(".",",")  + gb + "\n       Download : " + download.toString().replace(".",",") + gb;
          }
          
          var usedVolumeM = this.usedVolume;
          this.usedVolume = this.usedVolume /1024;
          
          if (this.usedVolume > this.totalVolume) {
            var totalVolumeM = this.totalVolume * 1024;
            var pricePerM;
          
            if (this.totalVolume == 2 || this.totalVolume == 30)
              pricePerM = 0.00776;
            else
              pricePerM = 0.00146;
              
            this.amountToPay = Math.round(Math.ceil(usedVolumeM - totalVolumeM)*pricePerM*100)/100;
            
            if (this.totalVolume == 2 || this.totalVolume == 30)
              if (this.amountToPay > 50)
                this.amountToPay = 50;
            
            this.amountToPay = this.amountToPay + " CAD";
          
          }
        }
        this.remainingDays = Minimeter.getInterval(volumeused[3]+"/"+volumeused[2]+"/"+volumeused[1]);
        this.update(true);
    }
}
