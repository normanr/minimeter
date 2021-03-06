
Minimeter.Comcast = function(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "comcast.png";
    this.name = "Comcast";
    this.url = "https://customer.comcast.com/Secure/Users.aspx";
    this.ligne = '';
    if(username.indexOf(",") > 0)
      this.ligne = username.substr(username.indexOf(",")+1);
}

Minimeter["Comcast"].prototype = new Minimeter.Monitor();

Minimeter["Comcast"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        var postdata = "user="+this.username+"&passwd="+this.password+"&forceAuthn=true&s=ccentral-cima&r=comcast.net&continue=https%3A%2F%2Fcustomer.comcast.com%2FSecure%2FHome.aspx&lang=en"+"_ToolkitScriptManager1_HiddenField=&__EVENTTARGET=";
        
        Minimeter.http_post('https://login.comcast.net/login', postdata, this, step+1);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/The username and password entered do not match|Your Comcast ID or email and password don/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        
        var regRedirect = /You are being redirected to the destination/;
        var regCimaticket=/<input type="hidden" name="cima.ticket" value="([0-9A-Za-z#-_]*)">/;
        if (!regRedirect.test(reply) || !regCimaticket.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var cimaticket = regCimaticket.exec(reply);
        
        var postdata = "cima.ticket="+cimaticket[1];
        
        Minimeter.http_post("https://customer.comcast.com/Secure/Home.aspx", postdata, this, step+1);
        break;
        
      case 3:
        reply = decodeURIComponent(reply);
        
        var regLoadingHome = /Retrieving your account information, one moment please/;
        var regHome = /My Account Summary/;
        if (!regLoadingHome.test(reply)) {
          if (!regHome.test(reply))
            this.reportError(step, this.name, encodeURIComponent(reply));
          else
            Minimeter.http_get("https://customer.comcast.com/Secure/Users.aspx", this, step+2);
          break;
        }
        
        Minimeter.http_get("https://customer.comcast.com/Secure/Preload.aspx?backTo=%2fSecure%2fHome.aspx", this, step+1);
        break;
        
      case 4:
        reply = decodeURIComponent(reply);
        
        var regHomeLoad = /Retrieving your account information, one moment please/;
        var regHome = /My Account Summary/;
        if (!regHomeLoad.test(reply) && !regHome.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        Minimeter.http_get("https://customer.comcast.com/Secure/Users.aspx", this, step+1);
        break;
        
      case 5:
        reply = decodeURIComponent(reply);
        var regusedtotal=/([0-9]*)GB of ([0-9]*)GB/g;
        var volumeusedtotal;
        if (!regusedtotal.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        regusedtotal.lastIndex = 0; // reset match counter
        volumeusedtotal = regusedtotal.exec(reply);
        if (this.ligne != '') {
          var i=1;
          var volumeusedtotalback;
          while (i<this.ligne && volumeusedtotal !== null) {
            volumeusedtotalback = volumeusedtotal;
            volumeusedtotal = regusedtotal.exec(reply);
            i++;
          }
          if (volumeusedtotal === null)
            volumeusedtotal = volumeusedtotalback;
        }
        this.usedVolume = volumeusedtotal[1]*1;
        this.totalVolume = volumeusedtotal[2]*1;
        this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
          
        this.update(true);
    }
}
