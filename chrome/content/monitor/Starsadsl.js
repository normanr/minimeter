
function Starsadsl(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "starsadsl.png";
    this.name = "3Stars ADSL";
    this.url = "http://myaccount.3starsadsl.be/Beheer/Datavolume/Index.aspx";
}

// similaire à Fulladsl et dérivés

Starsadsl.prototype = new Monitor();

Starsadsl.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        http_get("http://myaccount.3starsadsl.be/Beheer/Index.aspx", this, 2);
        break;
          
      case 2:
        reply = unescape(reply);
        var regViewstate=/VIEWSTATE" value="([0-9a-zA-Z\/=+]*)"/;
        var regEventvalidation=/EVENTVALIDATION" value="([0-9a-zA-Z\/=+]*)"/;
        if (!regViewstate.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        viewstate = (regViewstate.exec(reply));
        viewstate = viewstate[1].replace(/\//g,"%2F").replace(/\+/g,"%2B");
        eventvalidation = (regEventvalidation.exec(reply));
        eventvalidation = eventvalidation[1].replace(/\//g,"%2F").replace(/\+/g,"%2B");
    
        var postdata = "ctl02_ToolkitScriptManager1_HiddenField=&__EVENTTARGET=ctl02%24cphWhiteLabel%24lgBeheren%24LoginLinkButton&__EVENTARGUMENT=&__VIEWSTATE="+viewstate+"&ctl02%24cphWhiteLabel%24lgBeheren%24UserName="+this.username+"&ctl02%24cphWhiteLabel%24lgBeheren%24Password="+this.password+"&__EVENTVALIDATION="+eventvalidation;
        //postdata = htmlencode(postdata);
        
        http_post('http://myaccount.3starsadsl.be/Beheer/index.aspx', postdata,this, 3);
        break;
        
      case 3:
        reply = unescape(reply);
        var regErrorLogin=/pas pu retrouver la combinaison de votre nom|We konden de combinatie van je gebruikersnaam en wachtwoord/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        var regusedtotal=/([0-9,.]*) GB \/ ([0-9,.]*) GB<\/span>/;
        if (!regusedtotal.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        var volumeusedtotal = regusedtotal.exec(reply);
        this.usedVolume = volumeusedtotal[1].replace(',','.')*1;
        this.totalVolume = volumeusedtotal[2].replace(',','.')*1;
        this.remainingDays = getInterval("firstDayNextMonth");
          
        this.update(true);
    }
}