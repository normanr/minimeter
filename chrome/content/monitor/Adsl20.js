
function Adsl20(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "adsl20.png";
    this.name = "ADSL20";
    this.url = "http://myaccount.adsl20.be/Beheer/Datavolume/Index.aspx";
}

// similaire à Fulladsl et dérivés

Adsl20.prototype = new Monitor();

Adsl20.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        http_get("http://myaccount.adsl20.be/Beheer/index.aspx", this, 2);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regViewstate=/VIEWSTATE" value="([0-9a-zA-Z\/=+]*)"/;
        var regEventvalidation=/EVENTVALIDATION" value="([0-9a-zA-Z\/=+]*)"/;
        if (!regViewstate.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        viewstate = (regViewstate.exec(reply));
        viewstate = encodeURIComponent(viewstate[1]);
        eventvalidation = (regEventvalidation.exec(reply));
        eventvalidation = encodeURIComponent(eventvalidation[1]);
    
        var postdata = "ctl02_ToolkitScriptManager1_HiddenField=&__EVENTTARGET=ctl02%24cphWhiteLabel%24lgBeheren%24LoginLinkButton&__EVENTARGUMENT=&__VIEWSTATE="+viewstate+"&ctl02%24cphWhiteLabel%24lgBeheren%24UserName="+this.username+"&ctl02%24cphWhiteLabel%24lgBeheren%24Password="+this.password+"&__EVENTVALIDATION="+eventvalidation;
        http_post('http://myaccount.adsl20.be/Beheer/index.aspx', postdata,this, 3);
        break;
        
      case 3:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/pas pu retrouver la combinaison de votre nom|We konden de combinatie van je gebruikersnaam en wachtwoord/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get("http://myaccount.adsl20.be/Beheer/Datavolume/Index.aspx", this, 4);
        break;
        
      case 4:
        reply = decodeURIComponent(reply);
        
        var regusedtotal=/([0-9,.]*) GB \/ ([0-9,.]*) GB<\/span>/;
        if (!regusedtotal.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var volumeusedtotal = regusedtotal.exec(reply);
        this.usedVolume = volumeusedtotal[1].replace(',','.')*1;
        this.totalVolume = volumeusedtotal[2].replace(',','.')*1;
        this.remainingDays = getInterval("firstDayNextMonth");
          
        this.update(true);
    }
}
