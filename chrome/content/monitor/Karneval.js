
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
				http_get('https://muj.karneval.cz/internet/traffic.php', this, 3);
				break;
			case 3:
				reply = unescape(reply);
				//var reg = /traffic.php' class='list2'>([0-9.]*) (G|M)B \/ ([0-9.]*) (G|M)B <\/a>/;
				var reg = /<td>([0-9,]*)(G|M)B<\/td>\s*<td>([0-9,]*)(G|M)B/;
				if(!reg.test(reply)){
					this.reportError();
				} else {
					var volume = reg.exec(reply);
					s1 = new String (volume[1]);
					s1 = s1.replace (",", ".");
					s2 = new String (volume[3]);
					s2 = s2.replace (",", ".");					
											
					var download = Math.round(100 * s1 / (volume[2]=='M' ? 1024 : 1)) / 100;
					var upload   = Math.round(100 * s2 / (volume[4]=='M' ? 1024 : 1)) / 100;

					this.extraMessage = "P\u0159ijat\u00E1 data: " + download +" GB\nOdeslan\u00E1 data: " + upload +" GB";
					this.usedVolume = (download > upload) ? download : upload;
					this.totalVolume = this.getCapacity();
      		
					this.update(true);
				}
					
		}	
				
}
