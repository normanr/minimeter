// thanks to Ethem Tolga and Ahmet Serkan
function Turk(username, password) {
    this.username = username;
    this.password = password;
    this.image = "turk.png"; // does not belong in class
    this.name = "Türk Telekom";
    this.url = "http://adslkota.ttnet.net.tr/adslkota/viewTransfer.do?dispatch=entry"
}

Turk.prototype = new Monitor();

Turk.prototype.callback = function(step, reply) {
		reply = unescape(reply);
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				var postdata = "dispatch=login&userName="+this.username+"&password="+this.password;
				http_post('http://adslkota.ttnet.net.tr/adslkota/loginSelf.do', postdata,this, 2);
				break;
			case 2:
				http_get('http://adslkota.ttnet.net.tr/adslkota/viewTransfer.do?dispatch=entry', this, 3);
				break;
			case 3:
			   // up / dwn
			  var reg = /<td width="100">([0-9.]*)<br>&nbsp;\(.* ?B\)<\/td>\s*<td width="100">([0-9.]*)<br>&nbsp;\(.* ?B\)<\/td><\/tr><\/tbody>/;
			  if(!reg.test(reply)){
					this.reportError();
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


