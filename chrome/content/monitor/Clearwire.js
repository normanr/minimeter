
function Clearwire(username, password) {
    this.username = username;
    this.password = password;
    this.image = "clearwire.png";
    this.name = "Clearwire";
    this.url = "http://www.clearwire.be/index.php?section=433";
}

Clearwire.prototype = new Monitor();

Clearwire.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "login="+this.username+"&password="+this.password;
        http_post('http://www.clearwire.be/index.php?section=433&action=login_action', postdata,this, 2);
				break;
			case 2:
				var regused=/([0-9]*) MB<br><br>/;
				var regtotal=/([0-9]*) GB.<\/p>/;
				var regDateEnd = /([0-9]*)\/[0-9]*\/[0-9]*<br><br>/;
				
        reply = unescape(reply);
				if (!regused.test(reply)) {
          var regErrorLogin=/user\/pass incorrect/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
          }
          else
            this.notLoggedin();
				} else {
            var volumeused = regused.exec(reply);
            var volumetotal = regtotal.exec(reply);
            var dateend = regDateEnd.exec(reply);
            this.usedVolume = Math.round(volumeused[1]*1000/1024)/1000;
            this.totalVolume = volumetotal[1];
            this.remainingDays = getInterval("nearestOccurence", dateend[1]);
            this.update(true);
				}
					
		}	
				
}
