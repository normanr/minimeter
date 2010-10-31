Minimeter.Scarlet = function(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "scarlet.png"; // does not belong in class
    this.name = "Scarlet ADSL";
    this.url = "http://customercare.scarlet.be/usage/dispatch.do";
    this.contrat = null;
    if(username.indexOf(",") > 0)
      this.contrat = username.substr(username.indexOf(",")+1);
    this.selectProductTried = false;
    this.selectFeatureTried = false;
};

Minimeter["Scarlet"].prototype = new Minimeter.Monitor();

Minimeter["Scarlet"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        this.selectProductTried = false;
        this.selectFeatureTried = false;
				Minimeter.http_get('http://www.scarlet.be/customercare/logon.do?username='+this.username+'&password='+this.password,this, 2);
				break;
      case 2:
        var reply = decodeURIComponent(reply);
        var regLoggedIn = /Mon Abonnement|Mijn abonnement/;
        var regErrorLogin=/utilisateur ou mot de passe incorrect|gebruikersnaam of wachtwoord is fout/;
        var regServerError = /trop de tentatives de login|teveel op korte tijd aanlogt/
        if (!regLoggedIn.test(reply)) {
          if (regErrorLogin.test(reply))
            this.badLoginOrPass();
          else {
            if (regServerError.test(reply))
              this.error = "server";
            this.reportError(step, this.name, encodeURIComponent(reply));
          }
        }
        else {
          if(this.contrat != null)
            Minimeter.http_get('http://www.scarlet.be/customercare/selectbillcontract.do?method=select&selectedBillContract='+this.contrat,this, "2b");
          else 
            Minimeter.http_get('http://www.scarlet.be/customercare/usage/dispatch.do', this, 3);
        }
        break;
      case "2b":
        Minimeter.http_get('http://www.scarlet.be/customercare/usage/dispatch.do', this, 3);
        break;
      /*case "error":
        var reply = decodeURIComponent(reply);
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;*/
   		case 3:
			  var reply = decodeURIComponent(reply);
			  var total = /(est actuellement fixée à|verbruik staat momenteel ingesteld op|Votre limite de transfert de donnée est) <b>([0-9,.]*)\s*GB<\/b>/;
			  var used = /<th class="digit">(.*)\s*([kMG])B<\/th>\s*<\/tr>(\s*<\/tbody>|)\s*<\/table>/;
			  var usedZero = /instant aucune donn/; // Il n'y a pour l'instant aucune donnée pour cet abonnement. id=3498
        var regDateEnd = /(?:du|van) ([0-9]*)/;
			  var badpage = /GESELECTEERD/;
			  var regSelectProduct = /<option value="([0-9]*)">Scarlet (?:ONE|One)/;
			  var regSelectFeature = /<option value="([0-9]*)">Ip Access/;
			  
			  if(!used.test(reply) && !usedZero.test(reply)){
          if(!badpage.test(reply)) {
            if(regSelectProduct.test(reply) && (!this.selectProductTried || (!this.selectFeatureTried && regSelectFeature.test(reply)))) {
              var selectProduct = regSelectProduct.exec(reply);
              var postdata = "selectedProductId="+selectProduct[1];
              if (!this.selectProductTried)
                this.selectProductTried = true;
              else {
                this.selectFeatureTried = true;
                var selectFeature = regSelectFeature.exec(reply);
                postdata += "&selectedFeatureId="+selectFeature[1];
              }
                
              Minimeter.http_post('http://www.scarlet.be/customercare/usage/dispatch.do', postdata, this, 3);
              break;
            }
            else
              this.reportError(step, this.name, encodeURIComponent(reply));
          }
          else
            this.reportError(step, this.name, encodeURIComponent(reply));
            //Minimeter.http_get('http://www.scarlet.be/customercare/customercare/selectbillcontract.do', this, "error");
			  }
			  else {
          if (!total.test(reply))
            this.totalVolume = 0;
          else {
            var totalValue = total.exec(reply);
            this.totalVolume = totalValue[2].replace(',','.');
      		}
      		
          if (!usedZero.test(reply)) {
            var usedValue = used.exec(reply);
            this.usedVolume = (usedValue[1].replace(',','.') * 1);
            
            if(usedValue[2] == 'M')
              this.usedVolume /= 1024;
            else
              if(usedValue[2] == 'k')
                this.usedVolume /= (1024*1024);
          }
          else
            this.usedVolume = 0;
      		
      		this.usedVolume = this.usedVolume *1;
      		this.totalVolume = this.totalVolume *1;
          if( regDateEnd.test(reply) ){
            regDateEnd = regDateEnd.exec(reply);
            this.remainingDays = Minimeter.getInterval("nearestOccurence", regDateEnd[1]);
          }
      		
      		this.update(true);	
        }
					
		}	
				
}
