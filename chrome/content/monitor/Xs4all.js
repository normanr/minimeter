classN = "Xs4all";

function Xs4all(username, password) {
    this.username = username;
    this.password = password;
    this.image = "xs4all.png"; // does not belong in class
    this.name = "Xs4all ADSL";
}

Xs4all.prototype = new Monitor();

Xs4all.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				var postdata = 'authuser='+this.username+'&authpass=' + this.password;
        http_post('https://service.xs4all.nl/', postdata, this, 2);
				break;
			case 2:
				var postdata = 'user='+this.username;
        http_post('https://service.xs4all.nl/?mod=datatransfer&mod=overview&r=0.293000996801744', postdata, this, 3);  // r is sessie
        //http_get('http://users.skynet.be/miljaar/xs4all.htm', this, 3);
				break;
			case 3:

			  reply = unescape(reply);
			  
				var used =	/<td align=right class="body">([0-9.]*) GB<\/td>\s*<td align=right class="body">([0-9.]*) GB<\/td>/g;
				var sessie =	/r=([0-9.]+)/;


			  if( !used.test(reply)){ //!total.test(reply) ||
			     this.reportError(step, this.name, escape(reply));
			  } else {

					this.totalVolume = this.getCapacity();
					
					var usedValue;
					while((tmp = used.exec(reply))!= null){usedValue=tmp;}

					
      		this.extraMessage = "Up: " + (usedValue[1]*1).toFixed(2) +" GB, Down:" + (usedValue[2]*1).toFixed(2) +" GB";
      		this.usedVolume = ((usedValue[1]*1) + (usedValue[2]*1)).toFixed(2);


      		this.update(true);	
        }
					
		}	
				
}

