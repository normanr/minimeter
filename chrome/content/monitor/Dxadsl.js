
function Dxadsl(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "dxadsl.png";
    this.name = "dxADSL";
    this.url = "http://myaccount.dxadsl.be/Beheer/Datavolume/Index.aspx";
}

// similaire à Starsadsl

Dxadsl.prototype = new Monitor();

Dxadsl.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        http_get("http://myaccount.dxadsl.be/Beheer/index.aspx", this, 2);
        break;
          
      case 2:
        reply = unescape(reply);
        //var regEventtarget=/PostBackOptions(" value="([0-9a-zA-Z\/=+]*)"/;
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
        
        http_post('http://myaccount.dxadsl.be/Beheer/index.aspx', postdata,this, 3);
        break;
        
      case 3:
        reply = unescape(reply);
        var regErrorLogin=/pas pu retrouver la combinaison de votre nom|We konden de combinatie van je gebruikersnaam en wachtwoord/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get("http://myaccount.dxadsl.be/Beheer/Datavolume/Index.aspx", this, 4);
        break;
        
      case 4:
        reply = unescape(reply);
        
        var regusedtotal=/VolumeMaand_0">([0-9,]*) GB \/ ([0-9,]*) GB<\/span>/;
        if (!regusedtotal.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        var volumeusedtotal = regusedtotal.exec(reply);
        this.usedVolume = volumeusedtotal[1];
        this.totalVolume = volumeusedtotal[2]*1;
        this.remainingDays = getInterval("firstDayNextMonth");
          
        this.update(true);
    }
}