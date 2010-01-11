function Iinet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "iinet.png";
    this.name = "iiNet";
    this.url = "https://toolbox.iinet.net.au/";
    this.useSIPrefixes = true;
}

Iinet.prototype = new Monitor();

Iinet.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        http_get("https://toolbox.iinet.net.au/cgi-bin/basicauth.cgi?username="+this.username+"&password="+this.password+"&action=login&_=", this, 2);
        break;
        
      case 2:
        reply = decodeURIComponent(reply);
        var regAuthOK = /AuthOK\(\)/;
        if(!regAuthOK.test(reply)) {
          var regErrorLogin = /AuthFailed\(''\);/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
          }
          else {
            this.reportError(step, this.name, encodeURIComponent(reply));
          }
          break;
        }
        var postdata = "username="+this.username+"&password="+this.password+"&action=login";
        http_post(this.url, postdata, this, 3);
        break;
        
      case 3:
        reply = decodeURIComponent(reply);
        var regUsedTotPeak = /<b>peak<\/b><br>\s*<div class="usage_text">([0-9,]*)MB used of ([0-9,]*)MB/;
        var regUsedTotOffpeak = /<b>offpeak<\/b><br>\s*<div class="usage_text">([0-9,]*)MB used of ([0-9,]*)MB/;
        var regRemainingDays = /selected>([0-9]+)/;
        
        if(!regUsedTotPeak.test(reply) || !regUsedTotOffpeak.test(reply) || !regRemainingDays.test(reply)){
          var regErrorLogin = /Sorry, we couldn't log you in to your/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
            break;
          }
          else {
            this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }
        } 
        else {
        
          var volumeUsed = 0;
          var volumeTot = 0;
          var volumeUsedPeak = 0;
          var volumeTotPeak = 0;
          var volumeUsedOffpeak = 0;
          var volumeTotOffpeak = 0;
          
          var volumeUsedTotPeak = regUsedTotPeak.exec(reply);
          var volumeUsedTotOffpeak = regUsedTotOffpeak.exec(reply);
          var remainingDays = regRemainingDays.exec(reply);
          
          volumeUsedPeak = volumeUsedTotPeak[1].replace(',','');
          volumeTotPeak = volumeUsedTotPeak[2].replace(',','');
          volumeUsedOffpeak = volumeUsedTotOffpeak[1].replace(',','');
          volumeTotOffpeak = volumeUsedTotOffpeak[2].replace(',','');
          
          var d = new Date();
          var hour = d.getHours();
          if (hour > 2 && hour < 12) {
            volumeUsed = volumeUsedOffpeak;
            volumeTot = volumeTotOffpeak;
          }
          else {
            volumeUsed = volumeUsedPeak;
            volumeTot = volumeTotPeak;
          }
          
          this.usedVolume = volumeUsed/1000;
          this.totalVolume = volumeTot/1000;
          
          var mb = " " + getunitPrefix("MB"); // Unit as selected in locale
          
          this.extraMessage = "        Offpeak: "+ volumeUsedOffpeak + " / " + volumeTotOffpeak + mb + "\n        Peak: "+ volumeUsedPeak + " / " + volumeTotPeak + mb;
          
          this.remainingDays = getInterval("nearestOccurence", remainingDays[1]);
          this.update(true);
        }
    }
}
