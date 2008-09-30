
function Chello(username, password) {
    this.username = username;
    this.password = password;
    this.image = "chello.png";
    this.name = "Chello";
    this.url = "https://kraken.dkm.cz/"
}

Chello.prototype = new Monitor();

Chello.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				var postdata = "login="+this.username+"&pass="+this.password;
				http_post('https://kraken.dkm.cz/', postdata,this, 2);
				break;
			case 2:
				reply = unescape(reply);
				var regeng=/(.*)Active user/;
				var regcze=/u(.)ivatel/;
				if(regeng.test(reply)){
					var reg = /(.)Uploaded data:<\/td><td width="50%"><b>([0-9.]*) GB(.*\n.*)<b>([0-9.]*) GB/;
					var prihlasen=true;
					var zpr1="Uploaded";
					var zpr2="Downloaded";
				}
				if(regcze.test(reply)){
					var reg = /Odeslan(.) data:<\/td><td width="50%"><b>([0-9.]*) GB(.*\n.*)<b>([0-9.]*) GB/;
					var prihlasen=true;
					var zpr1="Odeslan\u00E1";
					var zpr2="P\u0159ijat\u00E1";
				}
				if(!prihlasen){
					this.notLoggedin();
				} else {
					var volume = reg.exec(reply);
					this.extraMessage = zpr1+ " data: " + volume[2] + " GB\n" + zpr2 + " data: " + volume[4] +" GB";
					this.usedVolume=(volume[2]*1 > volume[4]*1) ? volume[2] : volume[4];
					this.totalVolume = this.getCapacity();
      		
					this.update(true);
				}
					
		}	
				
}
