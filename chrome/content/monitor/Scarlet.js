
function Scarlet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "scarlet.png"; // does not belong in class
    this.name = "Scarlet ADSL";
    this.url = "http://customercare.scarlet.be/usage/dispatch.do";
}

Scarlet.prototype = new Monitor();

Scarlet.prototype.check = function() {
		this.state = this.STATE_BUSY;
		this.notify();
		this.callback(1);
}


Scarlet.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

 
		switch(step)
		{
			default:
			case 1:
				http_get('http://customercare.scarlet.be/logon.do?username='+this.username+'&password='+this.password+'&language=nl',this, 2);
				break;
			case 2:
			  http_get('http://customercare.scarlet.be/usage/dispatch.do', this, 3);
			  //http_get('http://www.epigoon.com/mozilla/minimeter/testing/scarlet.htm', this, 3);
			  break;
			case 3:
			  reply = unescape(reply);
			  var total = /verbruik staat momenteel ingesteld op <b>(.*)  GB<\/b>/;
			  var used = /<th class="digit">(.*)  ([MG])B<\/th>\s*<\/tr>\s*<\/table>/;
			  
			  if( !total.test(reply) || !used.test(reply) ){
					this.notLoggedin();
			  } else {
          
			    var totalValue = total.exec(reply);
      		this.totalVolume = totalValue[1].replace(',','.');

      		var usedValue = used.exec(reply);
      		this.usedVolume = (usedValue[1].replace(',','.') * 1);
      		
      		if(usedValue[2] == 'M'){
      			this.usedVolume /= 1000;
      		}
      		
      		this.usedVolume = this.usedVolume.toFixed(2);
      		
      		this.percentVolume = this.usedVolume * 100 / this.totalVolume;
      		this.update(true);	
        }
					
		}	
				
}
