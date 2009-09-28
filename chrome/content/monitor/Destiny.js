function Destiny(username, password) {
    this.username = username;
    this.password = password;
    this.image = "destiny.png";
    this.name = "Destiny";
    this.url = "http://volume.destiny.be/";
}

Destiny.prototype = new Monitor();

Destiny.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "username="+this.username+"&password="+this.password+"&login=1&contacteer=Check+Volume";
        http_post(this.url, postdata,this, 2);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regAllUsed = /<td style="text-align: right;">([0-9.]*) GB<\/td>\s*<td style="text-align: right;">([0-9.]*) GB<\/td>\s*<td style="text-align: right;">([0-9.]*) GB<\/td>\s*<\/tr>/;

        
        if(!regAllUsed.test(reply)){
          var regErrorLogin = /Invalid login/;
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
          var volumeUpload = 0;
          var volumeDownload = 0;
          
          var volumeAllUsed = regAllUsed.exec(reply);
          var volumeUsedUpload = volumeAllUsed[1];
          var volumeUsedDownload = volumeAllUsed[2];
            
          this.usedVolume = volumeAllUsed[3];
          this.totalVolume = this.getCapacity();
          
          var gb;
          if (isUseSI())
            gb = getString("unitSI.GiB");
          else
            gb = getString("unit.GB");
          gb = " " + gb;
          this.extraMessage = "       Download: "+ volumeUsedDownload  + gb + "\n       Upload: " + volumeUsedUpload  + gb;
          this.remainingDays = getInterval("firstDayNextMonth");
          this.update(true);
        }
    }
}
