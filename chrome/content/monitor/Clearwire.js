
Minimeter.Clearwire = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "clearwire.png";
    this.name = "Clearwire";
    this.url = "https://myaccount-be.clearwire.eu/";
}

Minimeter["Clearwire"].prototype = new Minimeter.Monitor();

Minimeter["Clearwire"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "sLog="+this.username+"&sPass="+this.password+"&iAction=4100";
        Minimeter.http_post('https://myaccount-be.clearwire.eu/lib/sSetProcess.php', postdata,this, 2);
				break;
			case 2:
				var regused=/([0-9]*) MB<br><br>/;
				var regtotal=/([0-9]*) GB.<\/p>/;
				var regDateEnd = /([0-9]*)\/[0-9]*\/[0-9]*<br><br>/;
				
        reply = decodeURIComponent(reply);
				if (!regused.test(reply)) {
          var regErrorLogin=/password incorrect|mot de passe incorrect|wachtwoord|Your user name and\/or password are\/is incorrect/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
          }
          else
            this.reportError(step, this.name, encodeURIComponent(reply));
				} else {
            var volumeused = regused.exec(reply);
            var volumetotal = regtotal.exec(reply);
            var dateend = regDateEnd.exec(reply);
            this.usedVolume = Math.round(volumeused[1]*1000/1024)/1000;
            this.totalVolume = volumetotal[1];
            this.remainingDays = Minimeter.getInterval("nearestOccurence", dateend[1]);
            this.update(true);
				}
		}	
}
