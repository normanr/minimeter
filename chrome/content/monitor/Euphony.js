
Minimeter.Euphony = function(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "euphony.png";
    this.name = "Euphony";
    this.url = "http://my.euphonynet.be/index.php";
}

Minimeter["Euphony"].prototype = new Minimeter.Monitor();

Minimeter["Euphony"].prototype.callback = function(step, reply) {
  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      var postdata = "username="+this.username+"&password="+this.password;
      Minimeter.http_post('http://my.euphonynet.be/index.php', postdata,this, 2);
      break;

    case 2:
      var regUsedAllowed=/<b>([0-9.]*) GB<\/b> [a-z ]* <b>([0-9.]*) GB<\/b>/;
      var regAllowedOver=/([0-9.]*) GB [a-z ]* ([0-9.]*) GB/;
      var regNoLimit=/no limit/;
      var regUsedNoLimit=/<b>([0-9.]*) GB<\/b>/;
      reply = decodeURIComponent(reply);
      if (!regUsedAllowed.test(reply) && !regAllowedOver.test(reply) && !regNoLimit.test(reply)) {
        var regErrorLogin=/(utilisateur sont disponibles sur|U vindt uw gebruikersgegevens)/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      else {
        if (!regNoLimit.test(reply)) {
          var volumeUsed = regUsedNoLimit.exec(reply);
          this.totalVolume = 0;
          this.usedVolume = volumeUsed[1] * 1;
        }
        else {
          if (regAllowedOver.test(reply)) {
            var volumeAllowedOver = regAllowedOver.exec(reply);
            this.totalVolume = volumeAllowedOver[1] *1;
            this.usedVolume = this.totalVolume + volumeAllowedOver[2] * 1;
          }
          else
          {
            var volumeUsedAllowed = regUsedAllowed.exec(reply);
            this.usedVolume = volumeUsedAllowed[1] * 1;
            this.totalVolume = volumeUsedAllowed[2] * 1;
          }
          if (this.usedVolume > this.totalVolume) {
            var regFormuleMax = /euSURF<sup>@max/;
            var pricePerGB = 0.5;
            if (regFormuleMax.test(reply))
              pricePerGB = 3;
            this.amountToPay = Math.ceil(this.usedVolume - this.totalVolume) * pricePerGB  + " EUR";
          }
        }
        this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
        this.update(true);
      }
  }
}
