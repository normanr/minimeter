
function Fulladsl(username, password) {
    this.username = (username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username).toLowerCase();
    this.password = password;
    this.image = "fulladsl.png"; // does not belong in class
    this.name = "Full ADSL";
    this.url = "http://myaccount.fulladsl.be/Beheer/Datavolume/Index.aspx"
}

Fulladsl.prototype = new Monitor();

Fulladsl.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        http_get("http://myaccount.fulladsl.be/Beheer/Index.aspx", this, 2);
        break;
			
			case 2:
        reply = unescape(reply);
        var regViewstate=/VIEWSTATE" value="([0-9a-zA-Z\/=+]*)"/;
        var regEventvalidation=/EVENTVALIDATION" value="([0-9a-zA-Z\/=+]*)"/;
        if (!regViewstate.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        viewstate = (regViewstate.exec(reply));
        viewstate = viewstate[1].replace(/\//g,"%2F").replace(/\+/g,"%2B");
        eventvalidation = (regEventvalidation.exec(reply));
        eventvalidation = eventvalidation[1].replace(/\//g,"%2F").replace(/\+/g,"%2B");
			
			
				var postdata = "ctl00%24cphWhiteLabel%24whIndex%24lgBeheren%24UserName="+this.username+"&ctl00%24cphWhiteLabel%24whIndex%24lgBeheren%24Password="+this.password;
				http_post('http://myaccount.fulladsl.be/Beheer/Index.aspx', postdata,this, 2);
				break;
			case 3:
        reply = unescape(reply);
        var regErrorLogin=/(pas pu retrouver la combinaison de votre nom|konden de combinatie van je gebruikersnaam en wachtwoord niet)/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
			
				http_get('http://myaccount.fulladsl.be/Beheer/Datavolume/Index.aspx', this, 3);
				break;
			case 4:
			  reply = unescape(reply);
			  var reg = /\>([0-9,]+) Gb \/ ([0-9,]+) Gb<\/span><\/td>/;

			  if(!reg.test(reply)){
            this.reportError(step, this.name, escape(reply));
			  } else {
			  
            var volume = reg.exec(reply);
	
      			this.usedVolume = ( volume[1].replace(",",".")*1 );
      			this.totalVolume =  ( volume[2].replace(",",".")*1) ;
      		
            this.remainingDays = getInterval("firstDayNextMonth");
      			this.update(true);	
       		 }
					
		}	
				
}


