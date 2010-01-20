// thanks to Ethem Tolga and Ahmet Serkan
Minimeter.Turk = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "turk.png"; // does not belong in class
    this.name = "Türk Telekom";
    this.url = "http://adslkota.ttnet.net.tr/adslkota/viewTransfer.do?dispatch=entry"
}

Minimeter["Turk"].prototype = new Minimeter.Monitor();

Minimeter["Turk"].prototype.callback = function(step, reply) {
		reply = decodeURIComponent(reply);
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				var postdata = "dispatch=login&userName="+this.username+"&password="+this.password;
				Minimeter.http_post('http://adslkota.ttnet.net.tr/adslkota/login_tr.jsp', postdata,this, 2);
				break;
			case 2:
				Minimeter.http_get('http://adslkota.ttnet.net.tr/adslkota/viewTransfer.do?dispatch=entry', this, 3);
				break;
			case 3:
			   // up / dwn
			  var reg = /<td width="100">([0-9.]*)<br>&nbsp;\(.* ?B\)<\/td>\s*<td width="100">([0-9.]*)<br>&nbsp;\(.* ?B\)<\/td><\/tr><\/tbody>/;
			  if(!reg.test(reply)){
          this.errorMessage = Minimeter.getString("error.reported");
          Minimeter.prefs.setCharPref("error", "reported");
          this.extraMessage = "Minimeter can't login because there's a captcha.";
          this.storeCache();
          this.errorPing("failed");
          this.state = this.STATE_ERROR;
			  
					//this.reportError(step, this.name, encodeURIComponent(reply));
			  } else {
			    var volume = reg.exec(reply);

      		var up = (volume[1].replace(/\./g, '')/1073741824).toFixed(2);
      		var down = (volume[2].replace(/\./g, '')/1073741824).toFixed(2);
 		
      		this.extraMessage = "Up: " + up +" GB, Down:" + down +" GB";
      		this.usedVolume = down; // only down is charged
      		this.totalVolume = this.getCapacity();
      		
      		this.update(true);
        }
					
		}	
				
}


