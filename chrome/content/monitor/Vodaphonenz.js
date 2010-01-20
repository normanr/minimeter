
Minimeter.Vodaphonenz = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "vodaphonenz.png";
    this.name = "Vodaphone";
    this.url = "https://the.vodafone.co.nz/acnts/myaccount-int.pl/usage";
}

Minimeter["Vodaphonenz"].prototype = new Minimeter.Monitor();

Minimeter["Vodaphonenz"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        var postdata = "_action=login&_pass=&_user=&username=&realm=%40ihug.co.nz&cmd=login&force_connetion=true&frames=true&selected_tpl=true&no_tcode=true&login="+this.username+"&password="+this.password;
        
        Minimeter.http_post('https://the.vodafone.co.nz/acnts/myaccounts.pl/login', postdata, this, step+1);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/The login and password supplied is incorrect/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        
        var regLoggedin = /You are being logged into the My Vodafone page/;
        if (!regLoggedin.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        Minimeter.http_get("https://the.vodafone.co.nz/acnts/myaccount-int.pl/usage", this, step+1);
        break;
        
      case 3:
        reply = decodeURIComponent(reply);
        var regusedtotal=/<\/div> ([0-9.]*) GB<\/b><\/td>\n*<td bgcolor=#ffffff align=right nowrap valign=bottom><b>([0-9.]*) GB<\/b><\/td>/;
        var regDateEnd = /<option value="([0-9]*)-([a-zA-Z]*)-([0-9]*) - /;
        if (!regusedtotal.test(reply) || !regDateEnd.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var volumeusedtotal = regusedtotal.exec(reply);
        this.usedVolume = volumeusedtotal[1]*1;
        this.totalVolume = volumeusedtotal[2]*1;
        
        var dateEnd = regDateEnd.exec(reply);
        this.remainingDays = Minimeter.getInterval("nearestOccurence", dateEnd[1]);
        
        this.update(true);
    }
}
