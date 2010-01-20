
Minimeter.Wildblue = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "wildblue.png";
    this.name = "WildBlue";
    this.url = "https://myusage.wildblue.net/UsageGUI/pages/index.xhtml";
}

Minimeter["Wildblue"].prototype = new Minimeter.Monitor();

Minimeter["Wildblue"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        Minimeter.http_get("https://myusage.wildblue.net/UsageGUI/pages/index.xhtml", this, 2);
        break;
          
      case 2:
        reply = decodeURIComponent(reply);
        var regLoginPage = /To retrieve your bandwidth usage data, login with your user name and password/;
        if (!regLoginPage.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
    
        var postdata = "mainForm%3Ausername="+this.username+"&mainForm%3Apassword="+this.password+"&mainForm%3A_id41=Login&mainForm=mainForm";
        Minimeter.http_post('https://myusage.wildblue.net/UsageGUI/pages/index.xhtml', postdata,this, 3);
        break;
        
      case 3:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/Invalid username and password combination/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        var regUsedTotalDownload=/Download<\/span><\/td>\s*<td><img src="\/UsageGUI\/images\/DownArrow.gif" alt="" \/><\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/td>\s*<td class="[^"]*">[0-9]* %\s*<\/td>\s*<td class="[^"]*">([0-9\.]*)\s*<\/td>\s*<td class="[^"]*">([0-9\.]*)\s*<\/td>/;
        var regUsedTotalUpload=/Upload<\/span><\/td>\s*<td><img src="\/UsageGUI\/images\/UpArrow.gif" alt="" \/><\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/td>\s*<td class="[^"]*">[0-9]* %\s*<\/td>\s*<td class="[^"]*">([0-9\.]*)\s*<\/td>\s*<td class="[^"]*">([0-9\.]*)\s*<\/td>/;
        
        if (!regUsedTotalDownload.test(reply) || !regUsedTotalUpload.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var volumeUsedTotalDownload = regUsedTotalDownload.exec(reply);
        var volumeUsedTotalUpload = regUsedTotalUpload.exec(reply);
        
        var volumeUsedDownload = volumeUsedTotalDownload[1];
        var volumeTotalDownload = volumeUsedTotalDownload[2];
        var volumeUsedUpload = volumeUsedTotalUpload[1];
        var volumeTotalUpload = volumeUsedTotalUpload[2];
        
        var volumeUsed = 0;
        var volumeTotal = 0;

        if ((volumeUsedDownload / volumeTotalDownload) > (volumeUsedUpload / volumeTotalUpload)) {
          volumeUsed = volumeUsedDownload;
          volumeTotal = volumeTotalDownload;
        }
        else {
          volumeUsed = volumeUsedUpload;
          volumeTotal = volumeTotalUpload;
        }
        
        this.usedVolume = volumeUsed;
        this.totalVolume = volumeTotal;
        
        var gb = " " + Minimeter.getunitPrefix("GB"); // Unit as selected in options and locale
        this.extraMessage = "        Download: "+ volumeUsedDownload + " / " + volumeTotalDownload + gb + " (" + Math.round(volumeUsedDownload / volumeTotalDownload * 100) + " %)" + "\n        Upload: " + volumeUsedUpload + " / " + volumeTotalUpload + gb + " (" + Math.round(volumeUsedUpload / volumeTotalUpload * 100) + " %)" + "\n       Total: " + (volumeUsedDownload*1 + volumeUsedUpload*1) + " / " + (volumeTotalDownload*1 + volumeTotalUpload*1) + gb + " (" + Math.round((volumeUsedDownload*1 + volumeUsedUpload*1) / (volumeTotalDownload*1 + volumeTotalUpload*1) * 100) + " %)";
        
        this.update(true);
    }
}