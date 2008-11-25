function Coditel(username, password) {
    this.username = username;
    this.password = password;
    this.image = "coditel.png"; // does not belong in class
    this.name = "Numericable";
    this.url = "http://www.numericable.be/conso.html";
}

Coditel.prototype = new Monitor();

Coditel.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "mac="+this.username;
        http_post("http://www.numericable.be/conso.html", postdata, this, 2);
        break;
          
      case 2:
        reply = unescape(reply);
        var regUsedTot = /<td>([0-9.]*) \/ ([0-9]*) GBytes\s*<\/tr>/;
        var regTotal = /<b class="forfait">([0-9]*) GBytes<\/b>/;
        var regUpload = /<b class="down">[0-9.]* GBytes<\/b> <span>\(([0-9.]*) MBytes\)/;
        var regDownload = /<b class="up">[0-9.]* GBytes<\/b> <span>\(([0-9.]*) MBytes\)/;
        
        var regErrorLogin=/Not Found|Format Incorrect/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        else
          if (regUsedTot.test(reply)) { // old page
            var volumeusedtot = regUsedTot.exec(reply);
            this.usedVolume = volumeusedtot[1]*1;
            this.totalVolume = volumeusedtot[2]*1;
          }
          else
            if (regUpload.test(reply) && regDownload.test(reply)) {
              if(regTotal.test(reply)) {
                var volumeTotal = regTotal.exec(reply);
                this.totalVolume = volumeTotal[1]*1;
              }
              else // flat rate
                this.totalVolume = 0;
              var volumeTotal = regTotal.exec(reply);
              var volumeUpload = regUpload.exec(reply);
              var volumeDownload = regDownload.exec(reply);
              this.usedVolume = Math.round((volumeUpload[1]*1 + volumeDownload[1]*1)/1024*1000)/1000;
            }
            else {
              this.reportError(step, this.name, escape(reply));
              break;
            }
  
            this.remainingDays = getInterval("firstDayNextMonth");
            if (this.usedVolume > this.totalVolume && this.totalVolume != 0) {
              if (this.totalVolume == 3) // 2€ / Gio
                this.amountToPay = Math.floor(this.usedVolume - this.totalVolume)*2 + " EUR";
              else
                if (this.totalVolume == 30 || this.totalVolume == 60) // 5€ / 10 Gio
                  this.amountToPay = Math.floor((this.usedVolume - this.totalVolume)/10)*10*5 + " EUR";
                else // 0.5€ / 250 Mio
                  this.amountToPay = Math.floor((this.usedVolume - this.totalVolume)*4)*0.5 + " EUR";
            }
            this.update(true);
    }
}

