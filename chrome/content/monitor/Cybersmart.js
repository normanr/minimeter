function Cybersmart(username, password) {
    this.username = username;
    this.password = password;
    this.image = "cybersmart.png"; // does not belong in class
    this.name = "Cybersmart";
    this.url = "http://www.cybersmart.co.za/getAccountDetails.cgi";
}

Cybersmart.prototype = new Monitor();

Cybersmart.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      var postdata = "accountName="+this.username+"&password="+this.password+"&submit.x=44&submit.y=18&submit=submit";
      http_get('http://www.cybersmart.co.za/getAccountDetails.cgi', this, 2);
      break;
        
    case 2:
      reply = decodeURIComponent(reply);
      var regErrorLogin=/Invalid account name or password/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      var regUsed = /<td class="usedTotal">([0-9.,-]*)<\/td>/;
      var regAllowed = /<td class="savedTotal"> ([0-9.]*)<\/td>/;
      
      if(!regUsed.test(reply) || !regAllowed.test(reply)){
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      
      var volumeused = regUsed.exec(reply);
      var volumetotal = regAllowed.exec(reply);
      
      this.usedVolume = volumeused[1]*-1;
      this.totalVolume = volumetotal[1];
      
      this.remainingDays = getInterval("firstDayNextMonth");
        
      this.update(true);
  }
}

