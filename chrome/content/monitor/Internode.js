
Minimeter.Internode = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "internode.png";
    this.name = "Internode";
    this.url = "https://customer-webtools-api.internode.on.net/cgi-bin/padsl-usage"
}

Minimeter["Internode"].prototype = new Minimeter.Monitor();

Minimeter["Internode"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = "username="+this.username+"&password="+this.password;
				Minimeter.http_post('https://customer-webtools-api.internode.on.net/cgi-bin/padsl-usage', postdata,this, 2);
				break;
			case 2:
			  reply = decodeURIComponent(reply);
			  var reg = /([0-9\.]+) ([0-9]+) ([0-9\/]+)/;
        var regDateEnd = /([0-9]+)\/([0-9]+)\/([0-9]+)/;

			  if(!reg.test(reply)){
          reply = decodeURIComponent(reply);
          var regErrorLogin=/Authentication failed/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
            break;
          }
					this.reportError(step, this.name, encodeURIComponent(reply));
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = (volume[1]/1000).toFixed(2);
      		this.totalVolume = (volume[2]/1000).toFixed(2);
          var dateEnd = regDateEnd.exec(reply);
          dateEnd = new Date(dateEnd[3], dateEnd[2], dateEnd[1]);
          dateEnd.setTime(86400000 + dateEnd.getTime());
          this.remainingDays = Minimeter.getInterval("nearestOccurence", dateEnd.getDate());
      		this.update(true);	
        }
		}	
}
