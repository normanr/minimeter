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
        http_get("https://mein.t-mobile.de/cpc-sp/actiondispatcher", this, 2);
        break;
          
      case 2:
        reply = unescape(reply);
        var regPostURL=/name="login" method="post" action="(\/cpc-sp\/loginhomepage\.do;ekp\.sessionId=[^".]*)"/;
        var regMeaSource=/name="mea_source" value="([^".]*)"/;
        if (!regPostURL.test(reply) || !regMeaSource.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        postURL = regPostURL.exec(reply);
        meaSource = regMeaSource.exec(reply);
        var postdata = "target=%2Fcpc%2F%3Fnull&username="+this.username+"&password="+this.password+"&Login=Login&mea_source="+meaSource[1];
        http_post("https://mein.t-mobile.de"+postURL[1], postdata,this, 3);
        break;
          
      case 3:
        reply = unescape(reply);
        var regErrorLogin=/Benutzername oder Passwort ist falsch/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        regGetURL = /regPostURL.exec(reply);href="(\/cpc\/showHomepage\.do\?[^".]*)">Kostenkontrolle<\/a>/;
        if (!regGetURL.test(reply)) {
          this.reportError(step, this.name, escape(reply));
          break;
        }
        getURL = regGetURL.exec(reply);
        http_get("https://mein.t-mobile.de"+getURL[1], this, 4);
        break;
          
      case 4:
        reply = unescape(reply);
        var regUsed = /<td class="cpc_homepage_cc_value">\s*([0-9.]*)\s*<\/td>\s*<td class="cpc_homepage_cc_unit">\s*Megabyte\s*<\/td>\s*<td class="cpc_homepage_cc_info">\s*und ([0-9]*) Kilobyte\s*<\/td>/;
        
        if(!regUsed.test(reply)){
          this.reportError(step, this.name, escape(reply));
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

