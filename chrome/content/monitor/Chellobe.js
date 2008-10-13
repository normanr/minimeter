function Chellobe(username, password) {
    this.username = username;
    this.password = password;
    this.image = "chellobe.png";
    this.name = "Chello";
    this.url = "http://utilisation.chello.be/cgi-bin/vthg_fr/vthg_showdata.cgi?firsturl=default";
}

Chellobe.prototype = new Monitor();

Chellobe.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "username="+this.username+"&password="+this.password;
        http_post('http://utilisation.chello.be/cgi-bin/vthg_fr/vthg_login.cgi', postdata,this, 2);
				break;
			case 2:
				var regused=/<font size="\+1">\s*([0-9]*)\s*<\/font><\/font><\/b>/;
        reply = unescape(reply);
				if (!regused.test(reply)) {
          var regErrorUnknown=/1130/;
          var regErrorLogin=/1122/;
          if (regErrorUnknown.test(reply)) {
            this.errorMessage = "Le serveur de Chello est indisponible";
            this.update(false);
          }
          else if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
          }
          else
            this.reportError(step, this.name, escape(reply));
				} else {
            var volumeused = regused.exec(reply);
            this.usedVolume = Math.round(volumeused[1]*1000/1024)/1000;
            this.totalVolume = this.getCapacity();
            this.remainingDays = getInterval("firstDayNextMonth");
            this.update(true);
				}
					
		}	
				
}
