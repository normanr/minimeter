
function Fulladsl(username, password) {
    this.username = (username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username).toLowerCase();
    this.password = password;
    this.image = "fulladsl.png"; // does not belong in class
    this.name = "FullADSL";
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
				var postdata = "login="+this.username+"&password="+this.password;
				http_post('http://myaccount.fulladsl.be/Beheer/Index.aspx?c=login', postdata,this, 2);
				break;
			case 2:
				http_get('http://myaccount.fulladsl.be/Beheer/Datavolume/Index.aspx', this, 3);
				break;
			case 3:
			  reply = unescape(reply);
			  var reg = /\>([0-9,]+) Gb \/ ([0-9,]+) Gb<\/span><\/td>/;

			  if(!reg.test(reply)){
					this.reportError();
			  } else {
			  
			    var volume = reg.exec(reply);
	
      			this.usedVolume = ( volume[1].replace(",",".")*1 );
      			this.totalVolume =  ( volume[2].replace(",",".")*1) ;
      		
            this.remainingDays = getInterval("firstDayNextMonth");
      			this.update(true);	
       		 }
					
		}	
				
}


