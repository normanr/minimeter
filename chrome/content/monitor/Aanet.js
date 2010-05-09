Minimeter.Aanet = function (username, password) {
  this.username = username;
  this.password = password;
  this.image = "aanet.png"; // does not belong in class
  this.name = "aaNet";
  this.url = "https://www.aanet.com.au/usage.html";
}

Minimeter["Aanet"].prototype = new Minimeter.Monitor();

Minimeter["Aanet"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      var postdata = "servicenumber="+this.username+"&password="+this.password;
      Minimeter.http_post('https://www.aanet.com.au/members', postdata,this, 2);
      break;
        
    case 2:
      var reply = decodeURIComponent(reply);
      var regErrorLogin=/Your login attempt failed./;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      Minimeter.http_get("https://www.aanet.com.au/usage.html", this, 3);
      break;
        
    case 3:
      var reply = decodeURIComponent(reply);
      var regUsedDown = /Month's Downloads to Date<\/b><\/td>\s*<td class='body2' width=20% bgcolor=#B3D5EC>([0-9]*) MBs<\/td>/;
      var regUsedUp = /Month's Uploads to Date<\/b><\/td>\s*<td class='body2' bgcolor=#B3D5EC>([0-9]*) MBs<\/td>/;
      var regAllowed = /<b>Prepaid Upload\/Download<\/b><\/td>\s*<td class='body2'>([0-9]*) MBs<\/td>/;
      var regDateEnd = /<td class='body2'> ([0-9]*)(?:st|nd|rd|th) of each month<\/td>/; // 1st, 2nd, 3rd, 4th...
      var regamountToPay = /<td class='body2'>\$([0-9.]*)<\/td>/;

      if(!regUsedDown.test(reply) || !regUsedUp.test(reply) || !regAllowed.test(reply) || !regDateEnd.test(reply) || !regamountToPay.test(reply)) {
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      
      var volumeuseddown = regUsedDown.exec(reply);
      var volumeusedup   = regUsedUp.exec(reply);
      var volumetotal    = regAllowed.exec(reply);
      var dateend        = regDateEnd.exec(reply);
      var amounttopay    = regamountToPay.exec(reply);
      var volumeused = 0;
      
      if (volumeusedup[1]*1 > volumeuseddown[1]*1)
        volumeused = volumeusedup[1];
      else
        volumeused = volumeuseddown[1];
      
      this.usedVolume = volumeused/1024;
      this.totalVolume = volumetotal[1]/1024;
      
      if(this.usedVolume > this.totalVolume)
        this.amountToPay = "CAD" + amounttopay[1];
      
      if( regDateEnd.test(reply) ){
        regDateEnd = regDateEnd.exec(reply);
        this.remainingDays = Minimeter.getInterval("nearestOccurence", dateend[1]);
      }
      this.update(true);
  }
}

