
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
				var regUsedAllowed=/<b>([0-9.]*) GB<\/b> [a-z]* <b>([0-9]*) GB<\/b>/;
        reply = unescape(reply);
				if (!regUsedAllowed.test(reply)) {
           this.reportError();
           break;
				}
        else {
          var volumeUsedAllowed = regUsedAllowed.exec(reply);
          this.usedVolume = volumeUsedAllowed[1];
          this.totalVolume = volumeUsedAllowed[2];
          this.remainingDays = getInterval("firstDayNextMonth");
          this.update(true);
        }
		}	
}
