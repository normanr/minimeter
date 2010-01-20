
Minimeter.Iburst = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "iburst.png"; // does not belong in class
    this.name = "IBurst";
    this.url = "https://helpdesk.wbs.co.za/cfusion/wbs/crm/usage_new.cfm"
}

Minimeter["Iburst"].prototype = new Minimeter.Monitor();

Minimeter["Iburst"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				var postdata = "UserName="+this.username+"&Password="+this.password+"&logmein=true";
				Minimeter.http_post('https://helpdesk.wbs.co.za/cfusion/wbs/crm/usage_new.cfm', postdata,this, 2);
				break;
			case 2:
				postdata = "userid=" + this.username;
				Minimeter.http_post('http://helpdesk.wbs.co.za/cfusion/wbs/crm/userdata.cfm', postdata, this, 3);
				break;	
			case 3:
			  reply = decodeURIComponent(reply);
			  var reg = /Gebruikt volume voor deze maand <strong>   ([0-9\.]+) GB<\/strong> van de beschikbare <strong>(.*) GB<\/strong>/;
			  
			  if(!reg.test(reply)){
					this.reportError(step, this.name, encodeURIComponent(reply));
			  } else {
			    var volume = reg.exec(reply);
      		this.usedVolume = volume[1];
      		this.totalVolume = volume[2];
      		this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
      		
      		this.update(true);	
        }
					
		}	
				
}
