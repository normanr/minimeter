
function Bt(username, password) {
    this.username = username;
    this.password = password;
    this.image = "bt.png";
    this.name = "British Telecom";
}

Bt.prototype = new Monitor();

Bt.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = "username="+this.username+"&password="+this.Password;
				http_post('http://www.bt.com/btbroadband/ns_usage_monitor.jsp', postdata,this, 1);
				break;
			case 2:
				http_get('http://www.bt.com/btbroadband/usage/',this, 3);
				break;
			case 3:
			  reply = unescape(reply);
			  var reg = /([0-9\.]+) ([0-9]+) ([0-9\/]+)/;

			  if(!reg.test(reply)){
			     this.reportError(step, this.name, escape(reply));
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = volume[1];
      		this.totalVolume = volume[2];
      		this.update(true);	
        }
					
		}	
				
}


