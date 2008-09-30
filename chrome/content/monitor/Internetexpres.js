
function Internetexpres(username, password) {
    this.username = username;
    this.password = password;
    this.image = "internetexpres.png";
    this.name = "Internet Expres";
    this.url = "https://konto.o2shop.cz/index.aspx"
    //this.url = "http://localhost/o2/index.htm"
}

Internetexpres.prototype = new Monitor();

Internetexpres.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				http_get('https://konto.o2shop.cz/public/login.aspx?uid='+this.username+'&pwd='+this.password, this, 2);
				//http_get('http://localhost/o2/index.htm', this, 2);
				break;
			case 2:
				http_get('https://konto.o2shop.cz/index.aspx', this, 3);
				//http_get('http://localhost/o2/index.htm', this, 3);				
				break;
			case 3:
				reply = unescape(reply);
				var reg = /<span class="tableTerraCurrent">[0-9,]*/;
				if(!reg.test(reply)){
					this.reportError();
				} else {
					var volume = reg.exec(reply);
					var s = new String(volume[0]);				
					var pole = s.split ('>');
					var data = pole[1].replace(",",".");
        
          var reg = /<span class="tableTerraLimit">[0-9,]*/;
				  if(!reg.test(reply)){
					  var limit = this.getCapacity();
				  } else {
					  volume = reg.exec(reply);		          			
					  s = new String(volume[0]);				
					  pole = s.split ('>');
					  s = pole[1];
					  pole = s.split (',');
					  limit = pole[0];
          }          
         					
					this.extraMessage = "P\u0159enesen\u00E1 data: " + data + " GB\nDatov\u00FD limit: " + limit + " GB";
					this.usedVolume = data;
					this.totalVolume = limit;
      		
					this.update(true);
				}
					
		}	
				
}

