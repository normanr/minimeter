Minimeter.Destiny = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "destiny.png";
    this.name = "Destiny";
    this.url = "http://volume.destiny.be/";
}

Minimeter["Destiny"].prototype = new Minimeter.Monitor();

Minimeter["Destiny"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "username="+this.username+"&password="+this.password+"&login=1&contacteer=Check+Volume";
        Minimeter.http_post(this.url, postdata,this, 2);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regAllUsed = /<td style="text-align: right;">([0-9.]*) ([MG])B<\/td>\s*<td style="text-align: right;">([0-9.]*) ([MG])B<\/td>\s*<td style="text-align: right;">([0-9.]*) ([MG])B<\/td>\s*<\/tr>/;

        
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
        
          var volumeAllUsed = regAllUsed.exec(reply);
          
          var volumeUpload =       volumeAllUsed[1];
          var volumeUploadUnit =   volumeAllUsed[2];
          var volumeDownload =     volumeAllUsed[3];
          var volumeDownloadUnit = volumeAllUsed[4];
          var volumeTotal =        volumeAllUsed[5];
          var volumeTotalUnit =    volumeAllUsed[6];
          
          if(volumeUploadUnit == "M")
            volumeUpload = Math.round(volumeUpload * 1000/1024)/1000;
          if(volumeDownloadUnit == "M")
            volumeDownload = Math.round(volumeDownload * 1000/1024)/1000;
          if(volumeTotalUnit == "M")
            volumeTotal = volumeTotal/1024;
          
          this.usedVolume = volumeTotal;
          this.totalVolume = this.getCapacity();;
          
          var gb = " " + Minimeter.getunitPrefix("GB"); // Unit as selected in options and locale
          this.extraMessage = "       Download: "+ volumeDownload  + gb + "\n       Upload: " + volumeUpload  + gb;
          this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
          this.update(true);
        }
    }
}
