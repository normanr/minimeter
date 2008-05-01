function Tvcablenet(username, password) {
    this.username = username.toLowerCase;
    this.password = password.toLowerCase;
    this.image = "tvcablenet.png"; // does not belong in class
    this.name = "Tvcablenet";
    this.url = "https://www.tvcablenet.be:3000/conexon/en/SubscriberTabsPage.jsp?currTab=bandwidth";
}

Tvcablenet.prototype = new Monitor();

Tvcablenet.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        http_get("https://www.tvcablenet.be:3000/conexon/jspservlets/StartServlet.jsp?pageDirectory=/conexon/en/&servlet=&displayPage=UserLoginPage", this, 2);
        break;
       
      case 2:
        reply = unescape(reply);
        var regSessionId = /sessionId" value="(.*)" type/;
        if(!regSessionId.test(reply)){
          this.notLoggedin();
          break;
        }
        var valSessionId = regSessionId.exec(reply);
       
        var postdata = "pageDirectory=%2Fconexon%2Fen%2F&pageUrl=%2Fconexon%2Fen%2FUserLoginPage.jsp&endPage=null&servlet=UserLoginServlet&displayPage=next_page_determined_later&helpId=&msg=&href=&focusField=&sessionId="+valSessionId+"&previousAlert=0&selfRegistered=N&userUsername="+this.username+"&userPassword="+this.password;
        http_post('https://www.tvcablenet.be:3000/conexon/jspservlets/StartServlet.jsp', postdata,this, 3);
        break;
          
      case 3:
        http_get("https://www.tvcablenet.be:3000/conexon/en/SubscriberTabsPage.jsp", this, 4);
        break;
          
      case 4:
        reply = unescape(reply);
        var regSubscriberId = /subscriberId" value="(.*)" type/;
        var regServiceProviderId = /serviceProviderId" value="(.*)" type/;
        var regAccountNumber = /accountNumber" value="(.*)" type/;
        if(!regSubscriberId.test(reply) || !regServiceProviderId.test(reply) || !regAccountNumber.test(reply)){
          this.unknownError(step,this.name);
          break;
        }
        var valSubscriberId = regSubscriberId.exec(reply);
        var valServiceProviderId = regServiceProviderId.exec(reply);
        var valAccountNumber = regAccountNumber.exec(reply);
        
        var postdata = "pageDirectory=%2Fconexon%2Fen%2F&pageUrl=%2Fconexon%2Fen%2FSubscriberTabsPage.jsp&servlet=SubscriberBandwidthDetailsGetServlet&displayPage=SubscriberBandwidthListPage&helpId=&msg=&href=&subscriberId="+valSubscriberId+"&serviceProviderId="+valServiceProviderId+"&accountNumber="+valAccountNumber+"&currTab=bandwidth&searchStartFrom=0&searchPagesStartFrom=0";
        http_post('https://www.tvcablenet.be:3000/conexon/jspservlets/StartServlet.jsp', postdata,this, 5);
        break;
          
      case 5:
        reply = unescape(reply);
        var regQuota = /Forfait<\/span><\/a><\/td>\s*<td class="label" valign="top">&nbsp;&nbsp;&nbsp;:&nbsp;<\/td>\s*<td class="sectionTitleValue">([0-9,]*) Gb<\/td>/;
        var regUsed = /mois en cours:<\/span><\/a>[A-Za-z]*<\/td>\s*<td class="label" valign="top">&nbsp;&nbsp;&nbsp;:&nbsp;<\/td>\s*<td class="sectionTitleValue">([0-9,]*) Gb<\/td>/;
        
        if(!regQuota.test(reply) || !regUsed.test(reply)){
          this.unknownError(step,this.name);
          break;
        } 
        else {
          var volumeQuota = 0;
          var volumeUsed = 0;
            
          volumeQuota = regQuota.exec(reply);
          volumeUsed = regUsed.exec(reply);
           
          this.usedVolume = volumeUsed[1].replace(",",".")*1;
          this.totalVolume = volumeQuota[1].replace(",",".")*1;
          this.remainingDays = getInterval("firstDayNextMonth");
          this.update(true);
        }
    }
}