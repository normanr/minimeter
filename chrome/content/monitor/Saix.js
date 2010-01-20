
Minimeter.Saix = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "saix.png"; // does not belong in class
    this.name = "Saix";
    this.url = "http://userstats.adsl.saix.net/";
}

Minimeter["Saix"].prototype = new Minimeter.Monitor();

Minimeter["Saix"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				Minimeter.http_auth(this.url, this.username, this.password,this, 2);
				break;

			case 2:
			  reply = decodeURIComponent(reply);
			  regErrorLogin = /Authorization Required/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
			  var reg = /<th>Combined \(Bytes\).*?<tr><td>([0-9\.]*)<\/td><td>([0-9]*)<\/td><td>([0-9 ]*)<\/td><td>([0-9 ]*)<\/td><td>([0-9 ]*)<\/td>/;

			  if(!reg.test(reply)){
					this.reportError(step, this.name, encodeURIComponent(reply));
			  } else {
			    var volume = reg.exec(reply);
			    var sessions = volume[1];
			    var hours = (volume[2].replace(/ /g, "")/3600).toFixed(0);
			    var up = (volume[3].replace(/ /g, "")/1073741824).toFixed(2);
			    var down = (volume[4].replace(/ /g, "")/1073741824).toFixed(2);
			    var both = (volume[5].replace(/ /g, "")/1073741824).toFixed(2);
			    
          var gb = " " + Minimeter.getunitPrefix("GB"); // Unit as selected in options and locale
			    
			    this.extraMessage = "Connected: " + sessions + " sessions, " + hours + " hours\nUp: " + up + gb + ", Down: " + down + gb;
			    this.usedVolume = both;
			    this.totalVolume = this.getCapacity();
			    this.remainingDays = Minimeter.getInterval("firstDayNextMonth");

			    this.update(true);	
			  }

		}

}

// http://stats.imaginet.co.za/adsl/
// http://www.axxess.co.za/test.php
