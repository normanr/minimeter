
function Voo(username, password) {
    this.username = username;
    this.password = password;
    this.image = "voo.png";
    this.name = "Voo";
    this.url = "http://www.voo.be/index.php?action=gen_page&idx=43&check=2";
}

Voo.prototype = new Monitor();

Voo.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "login="+this.username+"&PASSE="+this.password+"&Remplacer=Valider";
        http_post('http://myvoo.voo.be/acces/Acces-Actuel.asp', postdata,this, 2);
				break;
			case 2:
        reply = unescape(reply);
        var regErrorLogin=/Mauvaise combinaison de nom d/;
        var regErrorUnauthorized=/s refus/;
        var regErrorUnknown=/TABLE CLASS=ACCESERROR/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
        }
        else if (regErrorUnauthorized.test(reply)) {
          this.errorMessage = "Accès refusé";
          this.update(false);
        }
        else if (regErrorUnknown.test(reply)) {
          this.unknownError(step,this.name);
        }
        else {
        var postdata = "hMenu=equip";
        http_post('http://myvoo.voo.be/acces/Acces-Menu.asp', postdata,this, 3);
        }
				break;
			case 3:
				var regMAC=/CLIENT_MAC=([0-9A-E]*)'/;
        reply = unescape(reply);
				if (!regMAC.test(reply)) {
          this.notLoggedin();
				}
				else {
          var MACadress = regMAC.exec(reply);
          http_get("http://myvoo.voo.be/Giga/Index.asp?action=show_statistics_month&CLIENT_MAC="+MACadress[1], this, 4);
				}
				break;
      case 4:
        var regused=/<td align="right" width="20%">([0-9.,]*)<\/td>\s*<td align="left" width="10%">&nbsp;&nbsp;M/;
        var regConnTypeUnPeu = /Internet Un Peu/;
        var regConnTypeBcp = /Internet Beaucoup/;
        var regConnTypePassio = /Internet Passionn/;
        reply = unescape(reply);
				if (!regused.test(reply)) {
          this.notLoggedin();
				} else {
          var volumeused = regused.exec(reply);
          volumeused = volumeused[1].replace('.','');
          volumeused = volumeused.replace(',','.');
          volumeused = Math.round(volumeused/1024*1000)/1000;
          this.usedVolume = volumeused;
          if(regConnTypeUnPeu.test(reply)) {
            this.totalVolume = 0.5;
            if(this.usedVolume > this.totalVolume)
              this.amountToPay = Math.round((this.usedVolume - this.totalVolume)*2*100)/100 + " EUR";
          }
          else
            if(regConnTypeBcp.test(reply))
              this.totalVolume = 0;
            else
              if(regConnTypePassio.test(reply)) {
                this.totalVolume = 10;
                if(this.usedVolume > this.totalVolume)
                  this.amountToPay = Math.round((this.usedVolume - this.totalVolume)*100)/100 + " EUR";
              }
          this.remainingDays = getInterval("firstDayNextMonth");
          this.update(true);
				}
		}	
}
