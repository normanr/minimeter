
function Karneval(username, password) {
    this.username = username;
    this.password = password;
    this.image = "karneval.png";
    this.name = "Karneval";
    this.url = "https://muj.karneval.cz/internet/traffic.php"
}

Karneval.prototype = new Monitor();

Karneval.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				http_get('https://muj.karneval.cz/webmail/index.php?logout=0&user='+this.username+'&password='+this.password+'&host=mail.karneval.cz&port=993&rootdir=', this, 2);
				break;
			case 2:
				http_get('https://muj.karneval.cz/internet/index.php', this, 3);
				break;
			case 3:
				reply = unescape(reply);
				var reg = /traffic.php' class='list2'>([0-9.]*) (G|M)B \/ ([0-9.]*) (G|M)B <\/a>/;
				if(!reg.test(reply)){
					this.notLoggedin();
				} else {
					var volume = reg.exec(reply);
					var download = Math.round(100 * volume[1] / (volume[2]=='M' ? 1024 : 1)) / 100;
					var upload   = Math.round(100 * volume[3] / (volume[4]=='M' ? 1024 : 1)) / 100;

					this.extraMessage = "P\u0159ijat\u00E1 data: " + download +" GB\nOdeslan\u00E1 data: " + upload +" GB";
					this.usedVolume = (download > upload) ? download : upload;
					this.totalVolume = this.getCapacity();
      		
					this.update(true);
				}
					
		}	
				
}
