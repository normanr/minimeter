
Minimeter.Xtra = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "xtra.png"; // does not belong in class
    this.name = "Telecom Xtra";
    this.url = "http://www.telecom.co.nz/homepage";
}

Minimeter["Xtra"].prototype = new Minimeter.Monitor();

Minimeter["Xtra"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = 'realm=YourTelecom&goto=https%3A%2F%2Focds.yourtelecom.co.nz%2Fapp%2Focds%2Fgateway&username='+this.username+'&password='+this.password;
        Minimeter.http_post('https://login1.telecom.co.nz/distauth/ZeroPageLogin.jsp', postdata, this, 2);
				break;

			case 2:
			  reply = decodeURIComponent(reply);
			  
        var regErrorLogin=/or Password entered was incorrect/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
				
			  var regUsed = /\s([0-9,.]*) MB<\/nobr><br><img src=/;
			  var regTotal = /color=\"#003366\"><b>([0-9]*) MB<\/b>/;
			  var regUsedBT = /([0-9,.]*) MB/
        var regDateEnd = /Usage for:<\/td>\s*<td>([0-9]*)/;
        var regExcessPlans = /<td> (Basic|Pro) -/;
        var regBigTimePlan = /Big Time/;
			  
			  if((!regTotal.test(reply) || !regUsed.test(reply)) && !regUsedBT.test(reply)){
					this.reportError(step, this.name, encodeURIComponent(reply));
			  }
			  if (regTotal.test(reply)) {
          var totalValue = regTotal.exec(reply);
          this.totalVolume = totalValue[1] / 1024;
  
          var usedValue = regUsed.exec(reply);
          usedValue = usedValue[1].replace(',','');
          this.usedVolume = usedValue / 1024;
          
          if(this.usedVolume > this.totalVolume && regExcessPlans.test(reply))
            this.amountToPay = "$" + Math.round(Math.ceil(usedValue - totalValue[1])*0.02*100)/100;
        }
        else { //Big Time Plan
          var usedValue = regUsedBT.exec(reply);
          this.usedVolume = usedValue[1].replace(',','') / 1024;
          this.totalVolume = 0;
        }
      	
        if( regDateEnd.test(reply)) {
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = Minimeter.getInterval("nearestOccurence", regDateEnd[1]);
        }
      		
      	this.update(true);
        
		}
}
