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
        var regDateAndUsed = /<tbody>\s*<tr>\s*<td nowrap="nowrap">([0-9]*)-([0-9]*)-([0-9]*) (au|to)<br \/>[0-9-]*<\/td>\s*<td width="10"><\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>\s*<td><\/td>\s*<td align="right">([0-9.]*)<\/td>\s*<td align="right">[0-9.]*<\/td>/;
        
        if(!regDateAndUsed.test(reply)){
          var regErrorLogin = /Assurez-vous d'avoir bien inscrit votre nom d'utilisateur Internet/;
          var regErrorServer = /ne sont pas disponibles|is not available/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
            break;
          }
          else {
            if (regErrorServer.test(reply))
              this.error = "server";
            this.reportError(step, this.name, escape(reply));
            break;
          }
        }
        else {
          var volumeused = 0;
           
          volumeused = regDateAndUsed.exec(reply);
           this.totalVolume = this.getCapacity();
          
          this.extraMessage = "";
          
          if (this.totalVolume == 2 || this.totalVolume == 30 || this.totalVolume == 50 || this.totalVolume == 100) {
            this.usedVolume = volumeused[7]; // combiné
          }
          else {
            var gb;
            if (isUseSI())
                gb = getString("unitSI.GiB");
            else
                gb = getString("unit.GB");
            gb = " " + gb;
            this.usedVolume = volumeused[5];
            var upload = Math.round(volumeused[6]/1024*1000)/1000;
            var download = Math.round(volumeused[5]/1024*1000)/1000;
            this.extraMessage = "Upload : "+ upload  + gb + "\nDownload : " + download + gb;
          }
          
          var usedVolumeM = this.usedVolume;
          this.usedVolume = this.usedVolume /1024;
          
          if (this.usedVolume > this.totalVolume) {
            var totalVolumeM = this.totalVolume * 1024;
            var pricePerM;
          
            if (this.totalVolume == 2 || this.totalVolume == 20)
              pricePerM = 0.00776;
            else
              pricePerM = 0.00146;
              
            this.amountToPay = Math.round(Math.ceil(usedVolumeM - totalVolumeM)*pricePerM*100)/100;
            
            if (this.totalVolume == 2)
              if (this.amountToPay > 50)
                this.amountToPay = 50;
            else
              if (this.totalVolume == 20)
                if (this.amountToPay > 30)
                  this.amountToPay = 30;
            
            this.amountToPay = this.amountToPay + " CAD";
          
          }
        }
        this.remainingDays = getInterval(volumeused[3]+"/"+volumeused[2]+"/"+volumeused[1]);
        this.update(true);
    }
}