
function Xtra(username, password) {
    this.username = username;
    this.password = password;
    this.image = "xtra.png"; // does not belong in class
    this.name = "Telecom Xtra";
}

Xtra.prototype = new Monitor();

Xtra.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = 'USER='+this.username+'&PASSWORD='+this.password+'&SMENC=ISO-8859-1&SMLOCALE=US-EN&target=https://www.telecom.co.nz/jetstreamum/xtra&smauthreason=0&SSOLoginPage.btLogin=Log In ';
        http_post('https://www.telecom.co.nz/xtralogin.fcc?TYPE=33554433&REALMOID=06-0005cc45-3c3e-1f6c-93b5-80edbce40000&GUID=&SMAUTHREASON=0&METHOD=GET&SMAGENTNAME=$SM$bPLaid7UiFr%2fcTQchTKdU5ckPa0CnhjCk2Zds2Wopak%3d&TARGET=$SM$https%3a%2f%2fwww%2etelecom%2eco%2enz%2fjetstreamum%2fxtra', postdata, this, 3);

				break;

			case 3:

			  reply = unescape(reply);

			  var used = /\s([0-9.]*) MB<\/nobr><br><img src=/;
			  var total = /color=\"#003366\"><b>([0-9.]*) MB<\/b>/;
			  
			  if(!total.test(reply) || !used.test(reply)){
					this.reportError(step, this.name, escape(reply));
			  } else {
			  
			    var totalValue = total.exec(reply);
      		this.totalVolume = (totalValue[1] / 1000).toFixed(2);

      		var usedValue = used.exec(reply);
      		this.usedVolume = (usedValue[1] / 1000).toFixed(2);
      		
      		this.percentVolume = this.usedVolume * 100 / this.totalVolume;
      		this.update(true);	
        }
					
		}	
				
}

