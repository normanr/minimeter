
function Tvcablenet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "tvcablenet.png";
    this.name = "Tvcablenet";
    this.url = "http://mytvcablenet.tvcablenet.be/acces/acces-start.asp";
    this.urlstart = "http://mytvcablenet.tvcablenet.be";
}

// idem que Voo

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
        http_post(this.urlstart+ '/acces/Acces-Actuel.asp', postdata,this, 2);
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
          this.reportError(step, this.name, escape(reply));
        }
        else {
        http_get(this.urlstart+ '/acces/Acces-ConsoMenu.asp',this, 3);
        }
				break;
			case 3:
				var regNum=/Affiche_page_conso_giga\('([0-9]*)'\)/;
        reply = unescape(reply);
				if (!regNum.test(reply)) {
          this.reportError(step, this.name, escape(reply));
				}
				else {
          var NumEquip = regNum.exec(reply);
          
          http_get(this.urlstart+ "/acces/Acces-ConsoGiga.asp?eq_no="+NumEquip[1], this, 4);
				}
				break;
      case 4:
        var regUsedTot=/<td align="" >.*<\/td>\s*<td class="TEXT" align="right" >([0-9.]*)<\/td>\s*<td class="TEXT" align="right" >([0-9.]*)<\/td>\s*<td class="TEXT" align="right" >([0-9.]*)<\/td>\s*<td  class="TEXT" align="right"  style="font-size:10pt"><b>([0-9,]*)/;

        reply = unescape(reply);
				if (!regUsedTot.test(reply)) {
          this.reportError(step, this.name, escape(reply));
				}
				else {
			
					var volumeUsedTot = regUsedTot.exec(reply);
					
					this.usedVolume = Math.round(volumeUsedTot[1]*1000)/1000;
					this.totalVolume = Math.round(volumeUsedTot[2]*1000)/1000;

					if(this.totalVolume != 0 && this.usedVolume > this.totalVolume)
						if(volumeUsedTot[4] != 0)
							this.amountToPay = volumeUsedTot[4] + " EUR";
								
					this.remainingDays = getInterval("firstDayNextMonth");
					this.update(true);
				}
		}	
}
