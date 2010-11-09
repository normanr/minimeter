Minimeter.Iinet = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "iinet.png";
    this.name = "iiNet";
    this.url = "https://toolbox.iinet.net.au/";
    this.useSIPrefixes = true;
}

Minimeter["Iinet"].prototype = new Minimeter.Monitor();

Minimeter["Iinet"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        this.extraMessage = "";
        Minimeter.http_get("https://toolbox.iinet.net.au/cgi-bin/basicauth.cgi?username="+this.username+"&password="+this.password+"&action=login&_=", this, 2);
        break;
        
      case 2:
        var reply = decodeURIComponent(reply);
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
        Minimeter.http_post(this.url, postdata, this, 3);
        break;
        
      case 3:
        var reply = decodeURIComponent(reply);
        var regUsedTotPeak = /<b>peak<\/b><br>\s*<div class="usage_text">([0-9,]*)MB used of ([0-9,]*)MB/;
        var regUsedTotOffpeak = /<b>offpeak<\/b><br>\s*<div class="usage_text">([0-9,]*)MB used of ([0-9,]*)MB/;
        var regUsedTotNonFree = /<b>non-free<\/b><br>\s*<div class="usage_text">([0-9,]*)MB used of ([0-9,]*)MB/; // Business
        var regRemainingDays = /selected>([0-9]+)/;
        var regNoData = /no volume\s* was recorded for your account during this period/;
        
        if((!regUsedTotNonFree.test(reply) &&  (!regUsedTotPeak.test(reply) || !regUsedTotOffpeak.test(reply)) || !regRemainingDays.test(reply)) && !regNoData.test(reply)){
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
          
          var remainingDays = regRemainingDays.exec(reply);
          
          if (!regNoData.test(reply)) {
            if (regUsedTotNonFree.test(reply)) {
              var volumeUsedTotNonFree = regUsedTotNonFree.exec(reply);
              volumeUsed = volumeUsedTotNonFree[1].replace(',','');;
              volumeTot = volumeUsedTotNonFree[2].replace(',','');;
            }
            else {
              var volumeUsedTotPeak = regUsedTotPeak.exec(reply);
              var volumeUsedTotOffpeak = regUsedTotOffpeak.exec(reply);
              
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
              
              var mb = " " + Minimeter.getunitPrefix("MB"); // Unit as selected in locale
              
              this.extraMessage = "        Offpeak: "+ volumeUsedOffpeak + " / " + volumeTotOffpeak + mb + "\n        Peak: "+ volumeUsedPeak + " / " + volumeTotPeak + mb;
          
            }
            this.usedVolume = volumeUsed/1000;
            this.totalVolume = volumeTot/1000;
            this.saveCapacity();
          }
          else {
            this.usedVolume = 0;
            this.totalVolume = this.getCapacity();
          }
          
          this.remainingDays = Minimeter.getInterval("nearestOccurence", remainingDays[1]);
          this.update(true);
        }
    }
}
