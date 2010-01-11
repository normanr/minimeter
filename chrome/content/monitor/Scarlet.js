function Scarlet(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "scarlet.png"; // does not belong in class
    this.name = "Scarlet ADSL";
    this.url = "http://customercare.scarlet.be/usage/dispatch.do";
    this.contrat = null;
    if(username.indexOf(",") > 0)
      this.contrat = username.substr(username.indexOf(",")+1);
    this.selectProductTried = 0;
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
        this.selectProductTried = 0;
				http_get('http://customercare.scarlet.be/logon.do?username='+this.username+'&password='+this.password,this, 2);
				break;
      case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/(utilisateur ou mot de passe incorrect|gebruikersnaam of wachtwoord is fout)/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        if(this.contrat != null)
          http_get('http://customercare.scarlet.be/selectbillcontract.do?method=select&selectedBillContract='+this.contrat,this, "2b");
        else 
          http_get('http://customercare.scarlet.be/usage/dispatch.do', this, 3);
        break;
      case "2b":
        http_get('http://customercare.scarlet.be/usage/dispatch.do', this, 3);
        break;
      case "error":
        reply = decodeURIComponent(reply);
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
   		case 3:
			  reply = decodeURIComponent(reply);
			  var total = /(est actuellement fixée à|verbruik staat momenteel ingesteld op|Votre limite de transfert de donnée est) <b>([0-9,.]*)\s*GB<\/b>/;
			  var used = /<th class="digit">(.*)\s*([kMG])B<\/th>\s*<\/tr>(\s*<\/tbody>|)\s*<\/table>/;
			  var badpage = /GESELECTEERD/;
			  var regSelectProduct = /<OPTION VALUE="([0-9]*)">Scarlet ONE/;
			  var regSelectFeature = /<OPTION VALUE="([0-9]*)">Ip Access/;
			  
			  if(!used.test(reply) ){
          if(!badpage.test(reply)) {
            if(this.selectProductTried == 0 && regSelectProduct.test(reply)) {
              this.selectProductTried++;
              var selectProduct = regSelectProduct.exec(reply);
              var postdata = "selectedProductId="+selectProduct[1];
              if(regSelectFeature.test(reply)) {
                var selectFeature = regSelectFeature.exec(reply);
                postdata += "&selectedFeatureId="+selectFeature[1];
              }
              http_post('http://customercare.scarlet.be/usage/dispatch.do', postdata, this, 3);
              break;
            }
            else
              if (this.selectProductTried == 1) {
                http_get('http://www.scarlet.be/customercare/usage/detail.do', this, 3);
                break;
              }
            else
              this.reportError(step, this.name, encodeURIComponent(reply));
          }
          else
            this.reportError(step, this.name, encodeURIComponent(reply));
            //http_get('http://customercare.scarlet.be//customercare/selectbillcontract.do', this, "error");
			  } else {
          
          if (!total.test(reply))
            this.totalVolume = 0;
          else {
            var totalValue = total.exec(reply);
            this.totalVolume = totalValue[2].replace(',','.');
      		}

      		var usedValue = used.exec(reply);
      		this.usedVolume = (usedValue[1].replace(',','.') * 1);
      		
      		if(usedValue[2] == 'M')
      			this.usedVolume /= 1024;
      		else
            if(usedValue[2] == 'k')
              this.usedVolume /= (1024*1024);
      		
      		this.usedVolume = this.usedVolume *1;
      		this.totalVolume = this.totalVolume *1;
      		
      		this.update(true);	
        }
					
		}	
				
}
