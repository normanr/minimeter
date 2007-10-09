
function Mobistar(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "mobistar.png";
    this.name = "Mobistar";
    this.url = "http://www.mobistar.be/www/showPage?aWebcURL=09_ApplicationInformation/01_Descriptions/info_conso.xml";
}

Mobistar.prototype = new Monitor();

Mobistar.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "portlet_login001_1%7BactionForm.pagePrefix%7D=IM050&portlet_login001_1%7BactionForm.processPrefix%7D=IM_Login001&portlet_login001_1%7BactionForm.login%7D="+this.username+"&portlet_login001_1%7BactionForm.password%7D="+this.password;
        http_post('https://www.mobistar.be/www/portal/public/residential?_nfpb=true&portlet_login001_1_actionOverride=%2Fbe%2Fmobistar%2Fim%2Fprocess%2Fportlets%2Flogin001%2FprocessLogin&_windowLabel=portlet_login001_1&_pageLabel=applicationAuthentication', postdata,this, 2);
				break;
      case 2:
        http_get("http://www.mobistar.be/www/showPage?aWebcURL=09_ApplicationInformation/01_Descriptions/info_conso.xml", this, 3);
        break;
			case 3:
				var regUsedMB=/Vous avez consomm[\w&;]*\s*([0-9.]*) MB/;
				var regUsedGB=/Vous avez consomm[\w&;]*\s*([0-9.]*) GB/;
				var regUsedExceeded =/<strong>([0-9.]*) GB<\/strong>/;
				var regAmountToPay=/<strong>([0-9.]*)[\w&;]*EUR<\/strong>/;
				var regAllowed=/([0-9]*) GB./;
				var regDateEnd=/du[\w&;]*\s*([0-9]*)\//; // (17)/06/2007
        reply = unescape(reply);
			
        if((!regUsedMB.test(reply) && !regUsedGB.test(reply) && !regUsedExceeded.test(reply)) || !regAllowed.test(reply)){
          var regErrorLogin=/AuthFailed/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
            break;
          }
          else {
            this.unknownError(step,this.name);
            break;
          }
        }
        else {
          var volumeUsed, volumeAllowed, dateEnd, month, amountToPay;
          if(regUsedMB.test(reply)) {
            volumeUsed = regUsedMB.exec(reply);
            volumeUsed =  Math.round(volumeUsed[1]/1024*1000) /1000;
          }
          else
            if(regUsedGB.test(reply)){
              volumeUsed = regUsedGB.exec(reply);
              volumeUsed = volumeUsed[1];
          }
          else {
            volumeUsed = regUsedExceeded.exec(reply);
            volumeUsed = volumeUsed[1];
            amountToPay = regAmountToPay.exec(reply);
            amountToPay = amountToPay[1];
            this.amountToPay = amountToPay + " EUR";
          }
          var volumeAllowed = regAllowed.exec(reply);
          this.usedVolume = volumeUsed*1;
          this.totalVolume = volumeAllowed[1]*1;
          
          dateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", dateEnd[1]);
          
          this.update(true);
        }
		}
}
