
function Fulladsl(username, password) {
    this.username = username;
    this.password = password;
    this.image = "fulladsl.png"; // does not belong in class
    this.name = "Full ADSL";
    this.url = "http://www.fulladsl.be/Beheer/Datavolume/"
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
				http_post('http://www.fulladsl.be/Beheer/index.aspx?c=login', postdata,this, 2);
				break;
			case 2:
				http_get('http://www.fulladsl.be/Beheer/Datavolume/', this, 3);
				break;
			case 3:
			  reply = unescape(reply);
			  var reg = /\>([0-9,]+) Gb \/ ([0-9,]+) Gb<\/span><\/td>/;

			  if(!reg.test(reply)){
					this.notLoggedin();
			  } else {
			  
			    var volume = reg.exec(reply);
	
      			this.usedVolume = ( volume[1].replace(",",".")*1 );
      			this.totalVolume =  ( volume[2].replace(",",".")*1) ;
      			//this.name = "Skynet " + type.exec(reply)[1];
      		
      			this.update(true);	
       		 }
					
		}	
				
}


