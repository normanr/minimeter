Minimeter.Telenet = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "telenet.png"; 
    this.name = "Telenet";
    this.url = "http://my.telenet.be";
}

Minimeter["Telenet"].prototype = new Minimeter.Monitor();

Minimeter["Telenet"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

    switch(step)
    {
      default:
      case 1:
        var postdata = '<?xml version="1.0" encoding="UTF-8"?>'+"\n"+'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.telenet.be/TelemeterService/"><SOAP-ENV:Body><ns1:RetrieveUsageRequest><UserId>'+this.username+'</UserId><Password>'+this.password+'</Password></ns1:RetrieveUsageRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>' + "\n";
        Minimeter.http_post('https://t4t.services.telenet.be/TelemeterService', postdata,this, 2, null, "text/xml; charset=utf-8");
        break;
      case 2:
        reply = decodeURIComponent(reply);
        
        var regAllowed = /<Limit>([0-9]*)<\/Limit>/;
        var regUsed = /<TotalUsage>([0-9.]*)<\/TotalUsage>/;
        var regDateEnd = /<Day>([0-9-+:]*)<\/Day>/;
        var regOK = /ns2:RetrieveUsageResponse/;
        var regError = /ERRTLMTLS_0000([0-9])/;
        var regFairUseOk = /Uw volumeverbruik ligt in lijn met wat typisch is voor uw product/;
        
        if (!regOK.test(reply) && !regFairUseOk.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        if (!regError.test(reply)) {
        
          if ((!regAllowed.test(reply) || !regUsed.test(reply) || !regDateEnd.test(reply)) && !regFairUseOk.test(reply)) {
            this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }
          else if (regFairUseOk.test(reply)) {
            this.setFairUseOk();
          }
          else {
            var volumeused = regUsed.exec(reply);
            var volumetotal = regAllowed.exec(reply);
            var dateEnd = regDateEnd.exec(reply);
            
            this.totalVolume = Math.round(volumetotal[1]/1024*1000)/1000;
            this.usedVolume = Math.round(volumeused[1]/1024*1000)/1000;
            
            dateEnd = dateEnd[1].substr(8, 2);
            this.remainingDays = Minimeter.getInterval("nearestOccurence", dateEnd);
          }
        }
        
        /* Service error. */
        else {
          var errorMessage = regError.exec(reply);
          errorMessage = errorMessage[1];
          
          /* Too much requests (more than 2) for the last 60 minutes */
          if (errorMessage == 3) {
            this.error = "server";
            this.reportError(step, this.name, encodeURIComponent(reply));
          }
            
          /* Incorrect Login or Password */
          else
           if (errorMessage == 4 || errorMessage == 2)
            this.badLoginOrPass();
          
          /* Another error. */
          else {
            //this.errorMessage = "Webservice error : " + errorMessage[4];
            //Minimeter.consoleDump(errorMessage[2] + " " + errorMessage[4]);
            this.reportError(step, this.name, encodeURIComponent(reply));
          }
            break;
        }
      
        this.update (true);
    }
}
