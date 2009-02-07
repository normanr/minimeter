
function Xtra(username, password) {
    this.username = username;
    this.password = password;
    this.image = "xtra.png"; // does not belong in class
    this.name = "Telecom Xtra";
    this.url = "https://www.telecom.co.nz/xtralogin.fcc";
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
				
			  var regUsed = /\s([0-9,.]*) MB<\/nobr><br><img src=/;
			  var regTotal = /color=\"#003366\"><b>([0-9]*) MB<\/b>/;
        var regDateEnd = /Usage for:<\/td>\s*<td>([0-9]*)/;
        var regExcessPlans = /<td> (Basic|Pro) -/;
			  
			  if(!regTotal.test(reply) || !regUsed.test(reply)){
					this.reportError(step, this.name, escape(reply));
			  }
			  
        var totalValue = regTotal.exec(reply);
        this.totalVolume = Math.round(totalValue[1] / 1024*1000)/1000;

        var usedValue = regUsed.exec(reply);
        usedValue = usedValue[1].replace(',','');
        this.usedVolume = Math.round(usedValue / 1024*1000)/1000;
      	
        if(this.usedVolume > this.totalVolume && regExcessPlans.test(reply))
          this.amountToPay = "$" + Math.round(Math.ceil(usedValue - totalValue[1])*0.02*100)/100;
      	
        if( regDateEnd.test(reply)) {
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", regDateEnd[1]);
        }
      		
      	this.update(true);	
        
		}
}
