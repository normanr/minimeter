classN = "Saix";


function Saix(username, password) {
    this.username = username;
    this.password = password;
    this.image = "saix.png"; // does not belong in class
    this.name = "Saix";

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
				http_auth('http://userstats.adsl.saix.net/', this.username, this.password,this, 2);
				break;

			case 2:

			  reply = unescape(reply);
			  var reg = /<th>Combined \(Bytes\)<\/th><tr><td>([0-9]*)<\/td><td>([0-9 ]*)<\/td><td>([0-9 ]*)<\/td><td>([0-9 ]*)<\/td>/;

			  
			  if(!reg.test(reply)){
					this.notLoggedin();
			  } else {
			    var volume = reg.exec(reply);
			    strVol = volume[4].replace(/ /g, "");
			    strVol /= 1073741824;
			    
      		this.usedVolume = strVol.toFixed(2);
      		this.totalVolume = this.getCapacity();

      		this.update(true);	
        }
					
		}	
				
}

// http://stats.imaginet.co.za/adsl/
// http://www.axxess.co.za/test.php
