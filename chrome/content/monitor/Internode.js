
function Internode(username, password) {
    this.username = username;
    this.password = password;
    this.image = "internode.png";
    this.name = "Internode";
    this.url = "https://customer-webtools-api.internode.on.net/cgi-bin/padsl-usage"
}

Internode.prototype = new Monitor();

Internode.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = "username="+this.username+"&password="+this.password;
				http_post('https://customer-webtools-api.internode.on.net/cgi-bin/padsl-usage', postdata,this, 2);
				break;
			case 2:
			  reply = unescape(reply);
			  var reg = /([0-9\.]+) ([0-9]+) ([0-9\/]+)/;

			  if(!reg.test(reply)){
          reply = unescape(reply);
          var regErrorLogin=/Authentication failed/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
            break;
          }
					this.reportError(step, this.name, escape(reply));
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = (volume[1]/1000).toFixed(2);
      		this.totalVolume = (volume[2]/1000).toFixed(2);
      		this.update(true);	
        }
		}	
}