
function Internetexpres(username, password) {
    this.username = username;
    this.password = password;
    this.image = "internetexpres.png";
    this.name = "Internet Expres";
    this.url = "https://konto.telecom.cz/index.aspx"
}

Internetexpres.prototype = new Monitor();

Internetexpres.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				http_get('https://konto.telecom.cz/login.aspx?uid='+this.username+'&pwd='+this.password, this, 2);
				break;
			case 2:
				http_get('https://konto.telecom.cz/index.aspx', this, 3);
				break;
			case 3:
				reply = unescape(reply);
				var reg = /eseno \.\.\.\.\.\.\.\.\.  ([0-9,]*)GB(.*\r\n.*) ([0-9,]*) GB/;
				if(!reg.test(reply)){
					this.notLoggedin();
				} else {
					var volume = reg.exec(reply);
					var data = new String(volume[1]); data = data.replace(",",".");
					var limit = new String(volume[3]); limit = limit.replace(",",".");
					this.extraMessage = "P\u0159enesen\u00E1 data: " + data + " GB\nDatov\u00FD limit: " + limit + " GB";
					this.usedVolume = data;
					this.totalVolume = limit;
      		
					this.update(true);
				}
					
		}	
				
}

