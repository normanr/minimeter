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
        
        if (!regUsedTot.test(reply)){
          var regErrorLogin=/Not Found|Format Incorrect/;
          if (regErrorLogin.test(reply))
            this.badLoginOrPass();
          else
            this.reportError();
          break;
        }
        else {
          var volumeusedtot = regUsedTot.exec(reply);

          this.usedVolume = volumeusedtot[1]*1;
          this.totalVolume = volumeusedtot[2]*1;
          this.remainingDays = getInterval("firstDayNextMonth");
          if (this.usedVolume > this.totalVolume) {
            if (this.totalVolume == 3)
              this.amountToPay = Math.round((this.usedVolume - this.totalVolume)*2*100)/100 + " EUR";
            else
              this.amountToPay = Math.round((this.usedVolume - this.totalVolume)*0.5*100)/100 + " EUR";
          }
          this.update(true);
        }
    }
}

