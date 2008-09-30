
function Tvcablenet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "tvcablenet.png";
    this.name = "Tvcablenet";
    this.url = "http://mytvcablenet.tvcablenet.be/acces/acces-start.asp";
}

Tvcablenet.prototype = new Monitor();

Tvcablenet.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "login="+this.username+"&PASSE="+this.password+"&Remplacer=Valider";
        http_post('http://mytvcablenet.tvcablenet.be/acces/Acces-Actuel.asp', postdata,this, 2);
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
          this.reportError();
        }
        else {
        var postdata = "hMenu=equip";
        http_post('http://mytvcablenet.tvcablenet.be/acces/Acces-Menu.asp', postdata,this, 3);
        }
				break;
			case 3:
				var regMAC=/CLIENT_MAC=([0-9a-f]*)'/;
        reply = unescape(reply);
				if (!regMAC.test(reply)) {
          this.reportError();
				}
				else {
          var MACadress = regMAC.exec(reply);
          
          var regConnTypeLight = /Light/;
          var regConnTypeBase = /Base/;
          var regConnTypeSpeed = /Speed/;
          var regConnTypeCampus = /Campus/;
          var regConnTypeProPlus = /Pro\+/;
          var regConnTypePro = /Pro/; // tester d'abord Pro+
          var regConnTypeGold = /Gold/;
          
          if(regConnTypeLight.test(reply))
            this.totalVolume = 0.390;
          else
            if(regConnTypeBase.test(reply))
              this.totalVolume = 15;
            else
              if(regConnTypeSpeed.test(reply))
                this.totalVolume = 20;
              else
                if(regConnTypeCampus.test(reply))
                  this.totalVolume = 15;
                else
                  if(regConnTypeProPlus.test(reply))
                    this.totalVolume = 0;
                  else
                    if(regConnTypePro.test(reply))
                      this.totalVolume = 50;
                    else
                      if(regConnTypeGold.test(reply))
                        this.totalVolume = 0;
          
          http_get("http://mytvcablenet.tvcablenet.be/Giga/Index.asp?action=show_statistics_month&CLIENT_MAC="+MACadress[1], this, 4);
				}
				break;
      case 4:
        var regused=/<td align="right" width="20%">([0-9.,]*)<\/td>\s*<td align="left" width="10%">&nbsp;&nbsp;M/;
        reply = unescape(reply);
				if (!regused.test(reply)) {
          this.reportError();
				} else {
          var volumeused = regused.exec(reply);
          volumeused = volumeused[1].replace('.','');
          volumeused = volumeused.replace(',','.');
          volumeused = volumeused/1024;
          this.usedVolume = volumeused;
          
          if(this.totalVolume != 0 && this.usedVolume > this.totalVolume) {
            if(this.totalVolume == 0.390) {
                this.amountToPay = Math.round(Math.floor((this.usedVolume - this.totalVolume)*10)/10*50*100)/100 + " EUR";
            }
            else
              this.amountToPay = Math.round(Math.floor((this.usedVolume - this.totalVolume)*2)/2*100)/100 + " EUR";
              
            }
          this.remainingDays = getInterval("firstDayNextMonth");
          this.update(true);
				}
		}	
}
