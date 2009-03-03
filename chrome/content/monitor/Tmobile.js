function Tmobile(username, password) {
    this.username = username;
    this.password = password;
    this.image = "tmobile.png";
    this.name = "T-Mobile";
    this.url = "https://mein.t-mobile.de/cpc-sp/actiondispatcher";
}

Tmobile.prototype = new Monitor();

Tmobile.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "action=loginnow&username="+this.username+"&passwort="+this.password;
        http_post("https://mein.t-mobile.de/cpc-sp/actiondispatcher", postdata,this, 2);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/Benutzername oder Passwort ist falsch/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        var regGetURL = /regPostURL.exec(reply);href="(\/cpc\/showHomepage\.do\?[^".]*)">Kostenkontrolle<\/a>/;
        if (!regGetURL.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var getURL = regGetURL.exec(reply);
        http_get("https://mein.t-mobile.de"+getURL[1], this, 3);
        break;
          
      case 3:
        reply = decodeURIComponent(reply);
        var regUsed = /<td class="cpc_homepage_cc_value">\s*([0-9.]*)\s*<\/td>\s*<td class="cpc_homepage_cc_unit">\s*Megabyte\s*<\/td>\s*<td class="cpc_homepage_cc_info">\s*und ([0-9]*) Kilobyte\s*<\/td>/;
        
        if(!regUsed.test(reply)){
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        var volumeused = regUsed.exec(reply);
        volumeused[1] = volumeused[1].replace('.','');
        volumeused = Math.round((volumeused[1]/1024 + volumeused[2]/(1024*1024))*1000)/1000;

        this.usedVolume = volumeused;
        this.totalVolume = this.getCapacity();
        this.remainingDays = getInterval("firstDayNextMonth");
        
        this.update(true);
    }
}

