function Orange(username, password) {
    this.username = username;
    this.password = password;
    this.image = "orange.png"; // does not belong in class
    this.name = "Orange";
    this.url = "http://compte.orange.fr/moninternet/compte/bin/compte.cgi";
}

Orange.prototype = new Monitor();

Orange.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        http_get('http://compte.orange.fr/moninternet/compte/bin/compte.cgi', this, 2);
        break;
      case 2:
        reply = decodeURIComponent(reply);
        var regChargement = /Chargement en cours/;
        var regRemaining = /consommer :&nbsp;<\/td>\s*<td class="ligne_orange"><strong><nobr>([0-9.]*) Go/;
        var regTotal = /mois :&nbsp;<\/td>\s*<td class="ligne_blanche"><strong><nobr>([0-9.]*) Go/;
        var regUsedNoLimit = /Volume consomm&eacute; \*\* :&nbsp;<\/td>\s*<td class="ligne_orange"><strong><nobr>([0-9.< ]*)Go<\/nobr>/
        var regSupp = /dit :&nbsp;<\/td>\s*<td class="ligne_blanche"><strong><nobr>([0-9.]*) Go/;
       
        if((!regRemaining.test(reply) || !regTotal.test(reply)) && !regUsedNoLimit.test(reply)){
          if (this.trialNumber == 2 && regChargement.test(reply)) {
            this.tryAgain(3);
						break;
					}
					else {
            this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }
        }
        else {
          var volume = null;
          var volumeremain = 0;
          var volumetotal = 0;
          var volumesupp = 0;
         
          if (regRemaining.test(reply)) {
            volumeremain = regRemaining.exec(reply);
            volumetotal = regTotal.exec(reply);
            if(regSupp.test(reply)) {
              volumesupp = regSupp.exec(reply);
              volumesupp = volumesupp[1];
            }
            this.usedVolume = Math.round(volumetotal[1]*1000 - volumeremain[1]*1000 + volumesupp*1000)/1000;
            this.totalVolume = volumetotal[1];
          }
          else {
            var volumeused = regUsedNoLimit.exec(reply);
            if (volumeused[1] == "< 1")
              volumeused[1] = 0;
            else
              volumeused[1] = volumeused[1].replace(" ", "");
            this.usedVolume = volumeused[1];
            this.totalVolume = 0;
          }
        }
        this.remainingDays = getInterval("firstDayNextMonth");
        this.update(true);
        break;
      case 3: // if loginless method doesn't work
        var postdata = "credential="+this.username+"&user_enroll_new=&pwd="+this.password;
        http_post('http://id.orange.fr/auth_user/bin/auth_user.cgi?action=valider&origin=rs', postdata,this, 2);
        break;
    }
}
