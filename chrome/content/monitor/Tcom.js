
function Tcom(username, password) {
    this.username = username;
    this.password = password;
    this.image = "tcom.png"; // does not belong in class
    this.name = "Deutsche Telecom";
}

Tcom.prototype = new Monitor();

Tcom.prototype.check = function() {
		this.state = this.STATE_BUSY;
		this.notify();
		this.callback(1);
}


Tcom.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = "fuseaction=CheckLoginConnection&form_login="+this.username+"&form_password="+this.password+"&Langue_Id=2&Submit=Inloggen";
				http_post('https://e-care.skynet.be/index.cfm?function=connection.getVolume&language=nl', postdata,this, 2);
				break;
			case 2:
			  reply = unescape(reply);
			  var reg = /Gebruikt volume voor deze maand <strong>   (.*) GB<\/strong> van de beschikbare <strong>(.*) GB<\/strong>/;
			  var type = /Soort verbinding&nbsp;:&nbsp;<span class="topInfoLine2">(.*)<\/span>/;
			  
			  if(!reg.test(reply)){
					this.reportError();
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = volume[1];
      		this.totalVolume = volume[2];
      		this.percentVolume = this.usedVolume * 100 / this.totalVolume;
      		this.update(true);	
        }
					
		}	
				
}


