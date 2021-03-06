
Minimeter.Tvcablenet = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "tvcablenet.png";
    this.name = "Tvcablenet";
    this.url = "http://mytvcablenet.tvcablenet.be/acces/acces-start.asp";
    this.urlstart = "http://mytvcablenet.tvcablenet.be";
}

// idem que Voo

Minimeter["Tvcablenet"].prototype = new Minimeter.Monitor();

Minimeter["Tvcablenet"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "login="+this.username+"&PASSE="+this.password+"&Remplacer=Valider";
        Minimeter.http_post(this.urlstart+ '/acces/Acces-Actuel.asp', postdata,this, 2);
				break;
			case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/Mauvaise combinaison de nom d/;
        var regErrorUnauthorized=/s refus/;
        var regErrorUnknown=/TABLE CLASS=ACCESERROR/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
        }
        else if (regErrorUnauthorized.test(reply)) {
          this.errorMessage = "Acc�s refus�";
          this.update(false);
        }
        else if (regErrorUnknown.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
        }
        else {
        Minimeter.http_get(this.urlstart+ '/acces/Acces-ConsoMenu.asp',this, 3);
        }
				break;
			case 3:
				var regNum=/Affiche_page_conso_giga\('([0-9]*)'\)/;
				var regServerError=/en cours de maintenance/;
        reply = decodeURIComponent(reply);
				if (!regNum.test(reply)) {
					if (regServerError.test(reply))
						this.error = "server";
          this.reportError(step, this.name, encodeURIComponent(reply));
				}
				else {
          var NumEquip = regNum.exec(reply);
          
          Minimeter.http_get(this.urlstart+ "/acces/Acces-ConsoGiga.asp?eq_no="+NumEquip[1], this, 4);
				}
				break;
      case 4:
        var regUsedTot=/<td align="" >.*<\/td>\s*<td class="TEXT" align="right">([0-9.]*)<\/td>\s*<td class="TEXT" align="right">([0-9.]*)<\/td>\s*<td class="TEXT" align="right">([0-9.]*)<\/td>\s*<td  class="TEXT" align="right"  style="font-size:10pt"><b>([0-9,]*)/;
        var regUsedTotIllim=/<td align="" >.*<\/td>\s*<td class="TEXT" align="right">([0-9.]*)<\/td>\s*<td class="TEXT" align="right">(ILLIMIT.*)<\/td>/;

        reply = decodeURIComponent(reply);
				if (!regUsedTot.test(reply) && !regUsedTotIllim.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
				}
				else {
          if (regUsedTotIllim.test(reply)) {
            var volumeUsedTot = regUsedTotIllim.exec(reply);
            this.usedVolume = volumeUsedTot[1];
            this.totalVolume = 0;
          }
          else {
            var volumeUsedTot = regUsedTot.exec(reply);
            this.usedVolume = volumeUsedTot[1];
            this.totalVolume = volumeUsedTot[2];
					}

					if(this.totalVolume != 0 && this.usedVolume > this.totalVolume)
						if(volumeUsedTot[4] != 0)
							this.amountToPay = volumeUsedTot[4] + " EUR";
								
					this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
					this.update(true);
				}
		}
}
