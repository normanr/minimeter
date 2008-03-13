function Edpnet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "edpnet.png"; // does not belong in class
    this.name = "EDPnet";
    this.url = "http://www.edpnet.be/login.aspx";
}

Edpnet.prototype = new Monitor();

Edpnet.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE_ID=9900caa2-efdd-404c-9951-d6a9cd3f95cb&__VIEWSTATE=&tbUserID="+this.username+"&tbPassword="+this.password+"&btnLogin=Login";
        http_post('http://www.edpnet.be/login.aspx', postdata,this, 2);
        break;
          
      case 2:
        reply = unescape(reply);
        var regErrorLogin=/(Invalid user ID or password|Nom d'utilisateur ou mot de passe incorrect|Foutieve gebruikersnaam of wachtwoord)/;
        if (regErrorLogin.test(reply)) {
              this.badLoginOrPass("edpnet");
              break;
            }
        http_get("http://www.edpnet.be/list_dslconnections.aspx", this, 3);
        break;
          
      case 3:
        reply = unescape(reply);
        var regNumConn = /<img src='icons\/circle_green.gif'><\/td><td>&nbsp;[a-zA-Z0-9&#;]*<\/td><\/tr><\/table><\/td><td align="Center" valign="Top">\s*<a href='maint_dslconnection.aspx\?ID=([0-9]*)'/;
        if(!regNumConn.test(reply)) {
          this.reportError();
        }
        else {
          numConnection = regNumConn.exec(reply);
          this.url = "http://www.edpnet.be/maint_dslconnection.aspx?ID="+numConnection[1];
          http_get(this.url, this, 4);
        }
        break;
          
      case 4:
        reply = unescape(reply);
        var regUsed = /(Consommation en total \(Net\)|Totaal verbruik \(Netto\)|Total Consumption \(Net\))<\/td>\s*<td align="right">[0-9.,]*<\/td>\s*<td align="right">[0-9.,]*<\/td>\s*<td align="right">([0-9.,]*)<\/td>/;
        var regAllowed = /(Trafic compris \(gratuit\) |Inbegrepen \(gratis\) trafiek|Included \(Free\) Traffic):<\/td><td align="right">([0-9.]*)<\/td>/;
        var regDateEnd = /([0-9]*)-[0-9]*-[0-9]*<\/b><\/span><\/td>/;
        
        if(!regUsed.test(reply) || !regAllowed.test(reply)){
          this.reportError();
          break;
        }
        
        var volumeused = regUsed.exec(reply);
        var volumetotal = regAllowed.exec(reply);
        
        volumeused = volumeused[2].replace('.','').replace(',','.');
        volumetotal = volumetotal[2].replace('.','');

        this.usedVolume = Math.round(volumeused/1024*1000)/1000;
        this.totalVolume = Math.round(volumetotal/1024*1000)/1000;
        
        if(this.usedVolume > this.totalVolume)
          this.amountToPay = Math.round((this.usedVolume - this.totalVolume)*0.25*100)/100 + " EUR";
        
        if( regDateEnd.test(reply) ){
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", regDateEnd[1]);
        }
        this.update(true);
    }
}

