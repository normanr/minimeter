
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
        http_get('https://konto.o2shop.cz/Pages/login.aspx', this, 2);
				break;
			case 2:
        reply = unescape(reply);
        var regViewstate=/VIEWSTATE" value="([0-9a-zA-Z-\/=]*)"/;
        var regEventValidation=/EVENTVALIDATION" value="([0-9a-zA-Z-\/=]*)"/;
        if (!regViewstate.test(reply) || !regEventValidation.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        var viewstate = regViewstate.exec(reply);
        var eventValidation = regEventValidation.exec(reply);
			  var postdata = "__EVENTVALIDATION="+eventValidation[1]+"&__EVENTTARGET=ctl00$BodyContentHolder$LinkButtonLogin&__VIEWSTATE="+ viewstate[1] +"&ctl00$BodyContentHolder$TextBoxUid="+this.username+"&ctl00$BodyContentHolder$TextBoxPwd="+this.password;
			  http_post('https://konto.o2shop.cz/Pages/login.aspx?ReturnUrl=%2findex.aspx', postdata,this, 3);
				break;
			case 3:
        reply = unescape(reply);
        var regErrorLogin=/no nebo heslo/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
				var regUsed = /<span class="tableTerraCurrent">([0-9,]*)/;
        var regTotal = /<span class="tableTerraLimit">([0-9,]*)/;
        var regUnlimited = /<span class="tableTerraLimit">bez limitu/;
        
				if(!regUsed.test(reply)){
					this.reportError(step, this.name, escape(reply));
          break;
				}
        var volumeUsed = regUsed.exec(reply);
      
        if(!regTotal.test(reply)){
          if (regUnlimited.test(reply))
            this.totalVolume = 0;
          else {
            this.reportError(step, this.name, escape(reply));
            break;
          }
        }
        else {
          volumeTotal = regTotal.exec(reply);
          this.totalVolume = volumeTotal[1].replace(",",".");
        }
        this.usedVolume = volumeUsed[1].replace(",",".");
        
        this.update(true);
		}
}