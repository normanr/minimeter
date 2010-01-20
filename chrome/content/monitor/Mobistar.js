
Minimeter.Mobistar = function(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "mobistar.png";
    this.name = "Mobistar";
    this.url = "http://partners.mobistar.be/conso-adsl-logged/index.cfm?lg=FR";
}

Minimeter["Mobistar"].prototype = new Minimeter.Monitor();

Minimeter["Mobistar"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "portlet_login_6%7BactionForm.login%7D="+this.username+"&portlet_login_6%7BactionForm.password%7D="+this.password;
        Minimeter.http_post('https://www.mobistar.be/www/portal/public/residential?_nfpb=true&portlet_login_6_actionOverride=%2Fbe%2Fmobistar%2Fim%2Fprocess%2Fportlets%2Flogin001%2FprocessLogin&_windowLabel=portlet_login_6&_pageLabel=applicationAuthentication', postdata,this, 2);
				break;
      case 2:
        reply = decodeURIComponent(reply);
        var regLangNotChosen=/images\/languagep.jpg/;
        if (regLangNotChosen.test(reply)) {
          Minimeter.http_get("http://www.mobistar.be/www/portal/public/residential?_nfpb=true&_pageLabel=guesthome&language=fr_BE&event=languageEvent", this, 1);
          break;
        }
        
        var regLoginok=/(Bienvenue|Welkom)/;
        if (!regLoginok.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        Minimeter.http_get("http://partners.mobistar.be/conso-adsl-logged/index.cfm?lg=FR", this, 3);
        break;
			case 3:
				var regUsedMB=/Vous avez consommé <strong>\s*([0-9.]*) MB/;
				var regUsedGB=/Vous avez consommé <strong>\s*([0-9.]*) GB/;
				var regUsedExceeded =/<strong>([0-9.]*) GB<\/strong>/;
				var regAmountToPay=/<strong>([0-9.]*)[\w&;]*EUR<\/strong>/;
				var regAllowed=/([0-9]*) GB./;
				var regDateEnd=/(avant le|r) ([0-9]*) /; // avant le (15) Janvier 2009
				var regServerError=/en cours de maintenance/;
        reply = decodeURIComponent(reply);
			
        if((!regUsedMB.test(reply) && !regUsedGB.test(reply) && !regUsedExceeded.test(reply)) || !regAllowed.test(reply)){
					if (regServerError.test(reply))
						this.error = "server";
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        else {
          var volumeUsed, volumeAllowed, dateEnd, month, amountToPay;
          if(regUsedMB.test(reply)) {
            volumeUsed = regUsedMB.exec(reply);
            volumeUsed =  Math.round(volumeUsed[1]/1024*1000) /1000;
          }
          else
            if(regUsedGB.test(reply)){
              volumeUsed = regUsedGB.exec(reply);
              volumeUsed = volumeUsed[1];
          }
          else {
            volumeUsed = regUsedExceeded.exec(reply);
            volumeUsed = volumeUsed[1];
            if(regAmountToPay.test(reply)) {
              amountToPay = regAmountToPay.exec(reply);
              amountToPay = amountToPay[1];
              this.amountToPay = amountToPay + " EUR";
            }
          }
          var volumeAllowed = regAllowed.exec(reply);
          this.usedVolume = volumeUsed*1;
          this.totalVolume = volumeAllowed[1]*1;
          
          if(regDateEnd.test(reply)) {
            dateEnd = regDateEnd.exec(reply);
            this.remainingDays = Minimeter.getInterval("nearestOccurence", dateEnd[2]);
          }
          
          this.update(true);
        }
		}
}
