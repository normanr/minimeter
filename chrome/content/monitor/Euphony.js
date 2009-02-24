
function Euphony(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "euphony.png";
    this.name = "Euphony";
    this.url = "http://my.euphonynet.be/index.php";
}

Euphony.prototype = new Monitor();

Euphony.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "username="+this.username+"&password="+this.password;
        http_post('http://my.euphonynet.be/index.php', postdata,this, 2);
				break;
			case 2:
				var regUsedAllowed=/<b>([0-9.]*) GB<\/b> [a-z ]* <b>([0-9.]*) GB<\/b>/;
				var regAllowedOver=/([0-9.]*) GB [a-z ]* ([0-9.]*) GB/;
        reply = decodeURIComponent(reply);
				if (!regUsedAllowed.test(reply)) {
					if (regAllowedOver.test(reply)) {
					  var volumeAllowedOver = regAllowedOver.exec(reply);
					  this.totalVolume = volumeAllowedOver[1] *1;
					  this.usedVolume = this.totalVolume + volumeAllowedOver[2] * 1;
					}
					else {
						var regErrorLogin=/(utilisateur sont disponibles sur|U vindt uw gebruikersgegevens)/;
						if (regErrorLogin.test(reply)) {
							this.badLoginOrPass();
							break;
						}
						this.reportError(step, this.name, encodeURIComponent(reply));
						break;
          }
				}
        else {
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
				this.remainingDays = getInterval("firstDayNextMonth");
				this.update(true);
		}	
}
