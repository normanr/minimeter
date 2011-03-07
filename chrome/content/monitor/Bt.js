
Minimeter.Bt = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "bt.png";
    this.name = "British Telecom";
}

Minimeter["Bt"].prototype = new Minimeter.Monitor();

Minimeter["Bt"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = "TARGET=https%3A%2F%2Fwww.bt.com%2Fappsauth%2Flogin%2Fforward.do%3FsiteArea%3Dcon.mya%26url%3D%2Fyouraccount&smauthreason=0&siteArea=con.&USER="+this.username+"&PASSWORD="+this.password;
				Minimeter.http_post('https://www.bt.com/siteminderagent/forms/login.fcc', postdata,this, step+1);
				break;
			case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/Please check you entered your details correctly/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        this.reportError(step, this.name, encodeURIComponent(reply));
        
				//Minimeter.http_get('http://www.bt.com/btbroadband/usage/',this, step+1);
				break;
			case 3:
			  reply = decodeURIComponent(reply);
			  var reg = /([0-9\.]+) ([0-9]+) ([0-9\/]+)/;

			  if(!reg.test(reply)){
			     this.reportError(step, this.name, encodeURIComponent(reply));
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = volume[1];
      		this.totalVolume = volume[2];
      		this.update(true);	
        }
					
		}	
				
}


