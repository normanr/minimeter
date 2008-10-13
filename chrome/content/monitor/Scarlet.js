function Scarlet(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "scarlet.png"; // does not belong in class
    this.name = "Scarlet ADSL";
    this.url = "http://customercare.scarlet.be/usage/dispatch.do";
    this.nextCase = 2;
    if(username.indexOf(",") > 0)
      this.contrat = username.substr(username.indexOf(",")+1);
    else 
      this.nextCase = 3;
}

Scarlet.prototype = new Monitor();

Scarlet.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
				http_get('http://customercare.scarlet.be/logon.do?username='+this.username+'&password='+this.password+'&language=nl',this, this.nextCase);
				break;
      case 2:
        reply = unescape(reply);
        var regErrorLogin=/(utilisateur ou mot de passe incorrect|gebruikersnaam of wachtwoord is fout)/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get('http://customercare.scarlet.be/selectbillcontract.do?method=select&selectedBillContract='+this.contrat,this, 3);
        break;
   		case 3:
			  http_get('http://customercare.scarlet.be/usage/dispatch.do', this, 4);
			  break;
			case 4:
			  reply = unescape(reply);
			  var total = /(est actuellement fixée à|verbruik staat momenteel ingesteld op) <b>(.*)\s*GB<\/b>/;
			  var used = /<th class="digit">(.*)\s*([MG])B<\/th>\s*<\/tr>(\s*<\/tbody>|)\s*<\/table>/;
			  
			  if( !total.test(reply) || !used.test(reply) ){
					this.reportError(step, this.name, escape(reply));
			  } else {
          
			    var totalValue = total.exec(reply);
      		this.totalVolume = totalValue[2].replace(',','.');

      		var usedValue = used.exec(reply);
      		this.usedVolume = (usedValue[1].replace(',','.') * 1);
      		
      		if(usedValue[2] == 'M'){
      			this.usedVolume /= 1024;
      		}
      		
      		this.usedVolume = this.usedVolume;
      		
      		this.update(true);	
        }
					
		}	
				
}
