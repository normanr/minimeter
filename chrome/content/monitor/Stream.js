
function Stream(username, password) {
    this.username = username;
    this.password = password;
    this.image = "stream.png"; // does not belong in class
    this.name = "Stream ADSL";
    this.url = "https://customer.tochka.ru/go?src=counters&logname=" + this.username
}

Stream.prototype = new Monitor();

Stream.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				var postdata = "action=startup&logname="+this.username+"&password="+this.password;
				http_post('https://customer.tochka.ru/go?src=counters&logname=' + this.username, postdata,this, 2); //stream_adsl
				//http_get('http://epigoon.com/mozilla/minimeter/testing/stream.htm', this, 2);
				break;
			case 2:
			  reply = unescape(reply);
			  var reg = /<tr class=\"trowe\">\s*<td>.*<\/td>\s*<td align=\"center\">[0-9.]*<\/td>\s*<td align=\"center\">([0-9.]*)<\/td>/;

			  
			  if(!reg.test(reply)){
			     this.reportError();
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = (volume[1]/1000).toFixed(2);
      		this.totalVolume = this.getCapacity();

      		this.update(true);	
        }
					
		}	
				
}


