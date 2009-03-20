
function Tele2(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "tele2.png";
    this.name = "Tele2";
    this.url = "http://www.tele2.be/mytele2/usage.php";
    this.adsllight = false;
}

Tele2.prototype = new Monitor();

Tele2.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        var postdata = "username="+this.username+"&domain=tele2allin.be&password="+this.password;
        http_post('http://www.tele2.be/mytele2/index.php', postdata,this, 2);
        break;
      case 2:
        reply = unescape(reply);
        var regErrorLogin=/utilisateur et votre mot de passe. Veuillez|Wij herkennen uw gebruikersnaam en wachtwoord niet/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get("http://www.tele2.be/mytele2/adsl_index.php", this, 3);
        break;
      case 3:
        reply = unescape(reply);
        var regAdslLight = /<\/b><\/td>\s*<td>TELE2 ADSL Light<\/td>/;
        
        if (regAdslLight.test(reply))
          this.adsllight = true;
        http_get("http://www.tele2.be/mytele2/usage.php", this, 4);
        break;
          
      case 4:
        reply = unescape(reply);
        var regused=/<th class="totals">([0-9, ]*) MB<\/th>/;
        var regDateEnd = /<td>([0-9]*)[0-9\/]*<\/td>/;
        var regServerError = /indisponible|Nous mettons tout en oeuvre|tijdelijk onbeschikbaar|We stellen alles in het werk/;
        var regUnlimited = /gebruiksmeter is niet van toepassing voor u|De verbruiksmeter is voor u niet beschikbaar|pas accès à votre consommation car vous bénéficiez du téléchargement illimité/;
        if (regUnlimited.test(reply))
          this.setFlatRateWithoutInfos();
        else {
          if (!regDateEnd.test(reply)) {
            if (regServerError.test(reply))
              this.error = "server";
            this.reportError(step, this.name, escape(reply));
            break;
          }
          else {
            var dateEnd = regDateEnd.exec(reply);
            if (regused.test(reply)) {
              var volumeused = regused.exec(reply);
              this.usedVolume = Math.round(volumeused[1].replace(" ","").replace(",",".")/1024*1000)/1000;
            }
            else
              this.usedVolume = 0;
            this.totalVolume = (this.adsllight ? 0.244 : 15);
            this.remainingDays = getInterval("nearestOccurence", dateEnd[1]);
            if(this.usedVolume > this.totalVolume) {
              this.amountToPay = this.usedVolume - this.totalVolume;
              
              if (this.adsllight) {
                this.amountToPay = this.amountToPay * 51,2;
                if (this.amountToPay > 10)
                  this.amountToPay = 10;
              }
              this.amountToPay = Math.round(this.amountToPay*100)/100 + " EUR";
            }
          }
        }
        this.update(true);
    }   
}
