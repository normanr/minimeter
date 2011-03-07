Minimeter.Edpnet = function(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "edpnet.png"; // does not belong in class
    this.name = "EDPnet";
    this.url = "http://extra.edpnet.net/src/login.aspx";
    this.ligne = '';
    if(username.indexOf(",") > 0) {
      this.ligne = username.substr(username.indexOf(",")+1);
      this.url = "http://extra.edpnet.net/src/maint_dslconnection.aspx?ID="+this.ligne;
    }
};


Minimeter["Edpnet"].prototype = new Minimeter.Monitor();

Minimeter["Edpnet"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        Minimeter.http_get("http://extra.edpnet.net/src/login.aspx", this, 2);
        break;
          
      case 2:
        var reply = decodeURIComponent(reply);
        var regPageLogin=/My EDPnet - Login/;
        if (!regPageLogin.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var postdata = "__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE=&ctl00%24MainContent%24tbUserID="+this.username+"&ctl00%24MainContent%24tbPassword="+this.password+"&ctl00%24MainContent%24btnLogin=Login+%C2%BB";
        Minimeter.http_post('http://extra.edpnet.net/src/login.aspx', postdata,this, 3);
        break;
          
      case 3:
        var reply = decodeURIComponent(reply);
        var regLoginOK = /Dashboard/;
        var regErrorLogin=/The provided combination is not known by the/;
        var regManualActionNeeded = /Customer details/ // màj infos client
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass("edpnet");
          break;
        }
        if (!regLoginOK.test(reply)) {
          if (regManualActionNeeded.test(reply))
            this.userActionRequired();
          else
            this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        if (this.ligne == '')
          Minimeter.http_get("http://extra.edpnet.net/list_dslconnections.aspx", this, 4);
        else
          Minimeter.http_get(this.url, this, 5);
        break;
      case 4:
        var reply = decodeURIComponent(reply);
        var regNumConn = /<td class = (?:'|")status_g(?:'|")>[a-zA-Z0-9&#;é ]*<\/td><\/tr><\/table><\/td><td class="align-top">\s*<a href=(?:'|")maint_dslconnection.aspx\?ID=([0-9]*)(?:'|")/;
        var regNumConnYellow = /<td class = (?:'|")status_y(?:'|")>[a-zA-Z0-9&#;é ]*<\/td><\/tr><\/table><\/td><td class="align-top">\s*<a href=(?:'|")maint_dslconnection.aspx\?ID=([0-9]*)(?:'|")/;
        var regNumConnRed = /<td class = (?:'|")status_r(?:'|")>[a-zA-Z0-9&#;é ]*<\/td><\/tr><\/table><\/td><td class="align-top">\s*<a href=(?:'|")maint_dslconnection.aspx\?ID=([0-9]*)(?:'|")/;
        var numConnection;
        if(regNumConn.test(reply))
          numConnection = regNumConn.exec(reply);
        else
          if (regNumConnYellow.test(reply))
            numConnection = regNumConnYellow.exec(reply);
          else {
            if (regNumConnRed.test(reply))
              this.userActionRequired();
            else
              this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }

          this.url = "http://extra.edpnet.net/maint_dslconnection.aspx?ID="+numConnection[1];
          Minimeter.http_get(this.url, this, 5);
        break;
          
      case 5:
        var reply = decodeURIComponent(reply);
        var regUsed = /(Consommation en total \(Net\)|Totaal verbruik \(Netto\)|Total Consumption \(Net\))<\/td>\s*<td>[0-9.,]*<\/td>\s*<td>[0-9.,]*<\/td>\s*<td>([0-9.,]*)<\/td>/;
        var regUsedBrut = /(Consommation en total \(Brut\)|Totaal verbruik \(Bruto\)|Total Consumption \(Gross\))<\/td>\s*<td>[0-9.,]*<\/td>\s*<td>[0-9.,]*<\/td>\s*<td>([0-9.,]*)<\/td>/;
        var regIncluded = /(Trafic compris \(gratuit\) |Inbegrepen \(gratis\) trafiek|Included \(Free\) Traffic):<\/td><td>([0-9.]*)<\/td>/;
        var regAllowed = /(Trafic maximum autorisé en Mo|Maximum toegestane trafiek in MB|Maximum Allowed Traffic in MB):<\/td><td>([0-9.]*)<\/td>/;
        var regBonus = /(Bonus d'ancienneté en Mo:|Getrouwheidsbonus in MB|Loyalty bonus in MB)<\/td><td>([0-9.]*)<\/td>/;
        var regServerError = /temporary not avail[ai]ble/;
        var regNoLimit = /No Limit/;

        var regDateEnd = /([0-9]*)-[0-9]*-[0-9]*<\/span><\/td>/;
        
        if(!regUsed.test(reply) || (!regIncluded.test(reply) && !regAllowed.test(reply))){
					if (regServerError.test(reply))
						this.error = "server";
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        var volumeused = regUsed.exec(reply);
        
        if (regNoLimit.test(reply)) { // 1
          volumeused = regUsedBrut.exec(reply);
        }
        
        if (regIncluded.test(reply))
          var volumetotal = regIncluded.exec(reply);
        else
          var volumetotal = regAllowed.exec(reply);
        
        volumeused = volumeused[2].replace('.','').replace(',','.');
        volumetotal = volumetotal[2].replace('.','');
        
        if (regBonus.test(reply)) {
          bonus = regBonus.exec(reply);
          Minimeter.consoleDump (bonus[2]);
          bonus = bonus[2].replace('.','');
          volumetotal = volumetotal*1 + bonus*1;
        }
        
        if (regNoLimit.test(reply)) { // 2
          volumetotal = 0;
        }


        this.usedVolume = volumeused/1024;
        this.totalVolume = volumetotal/1024;
        
        if(this.usedVolume > this.totalVolume) {
          var pricePerGiB = 0.25;
          if (volumetotal >= 100)
            pricePerGiB = 1;
            
          this.amountToPay = Math.round(Math.ceil(this.usedVolume - this.totalVolume)*pricePerGiB*100)/100 + " EUR";
        }
        
        if( regDateEnd.test(reply) ){
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = Minimeter.getInterval("nearestOccurence", regDateEnd[1]);
        }
        this.update(true);
    }
}

