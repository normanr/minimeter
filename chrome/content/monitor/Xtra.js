
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
				var postdata = 'USER='+this.username+'&PASSWORD='+this.password+'&SMENC=ISO-8859-1&SMLOCALE=US-EN&target=https://www.telecom.co.nz/jetstreamum/xtraSum&smauthreason=0&SSOLoginPage.btLogin=Log In ';
        http_post('https://www.telecom.co.nz/xtralogin.fcc?TYPE=33554433&REALMOID=06-000eea98-b0df-12c4-808b-832af374000f&GUID=&SMAUTHREASON=0&METHOD=GET&SMAGENTNAME=$SM$5l9ZZOndBSrRIiJtF6CCGA%2fmNCiw87eRYL4EXOhS1OntVhKwVqD5IA%3d%3d&TARGET=$SM$https%3a%2f%2fwww.telecom.co.nz%2fjetstreamum%2fxtraSum', postdata, this, 2);
				break;

			case 2:
			  reply = unescape(reply);
			  
        var regErrorLogin=/incorrect User Name or password/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
				
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
