
function Saix(username, password) {
    this.username = username;
    this.password = password;
    this.image = "saix.png"; // does not belong in class
    this.name = "Saix";
    this.url = "http://userstats.adsl.saix.net/";
}

Saix.prototype = new Monitor();

Saix.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				http_auth(this.url, this.username, this.password,this, 2);
				break;

			case 2:

			  reply = unescape(reply);
			  var reg = /<th>Combined \(Bytes\).*?<tr><td>([0-9\.]*)<\/td><td>([0-9]*)<\/td><td>([0-9 ]*)<\/td><td>([0-9 ]*)<\/td><td>([0-9 ]*)<\/td>/;

			  if(!reg.test(reply)){
					this.reportError();
			  } else {
			    var volume = reg.exec(reply);
			    var sessions = volume[1];
			    var hours = (volume[2].replace(/ /g, "")/3600).toFixed(0);
			    var up = (volume[3].replace(/ /g, "")/1073741824).toFixed(2);
			    var down = (volume[4].replace(/ /g, "")/1073741824).toFixed(2);
			    var both = (volume[5].replace(/ /g, "")/1073741824).toFixed(2);
			    
			    if (isUseSI())
			        gb = getString("unitSI.GiB");
			    else
			        gb = getString("unit.GB");
			    
			    this.extraMessage = "Connected: " + sessions + " sessions, " + hours + " hours\nUp: " + up +" " + gb + ", Down: " + down +" " + gb;
			    this.usedVolume = both;
			    this.totalVolume = this.getCapacity();
			    this.remainingDays = getInterval("firstDayNextMonth");

			    this.update(true);	
			  }

		}

}

// http://stats.imaginet.co.za/adsl/
// http://www.axxess.co.za/test.php
