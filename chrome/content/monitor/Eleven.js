function Eleven(username, password) {
    this.username = username;
    this.password = password;
    this.image = "eleven.png";
    this.name = "E-leven";
    this.url = "http://volume.e-leven.be/e-levenmeter.php";
}

Eleven.prototype = new Monitor();

Eleven.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "user="+this.username+"&password="+this.password+"&login=Login";
        http_post('http://volume.e-leven.be/index.php', postdata,this, 2);
				break;
			case 2:
        reply = unescape(reply);
				var regused=/Total:<\/td>\s*<td align="center" class="tableHeader">([0-9.]*) MB<\/td>\s*<td align="center" class="tableHeader">([0-9.]*) MB<\/td>/;
				if (!regused.test(reply)) {
          var regErrorLogin=/Invalid Login/;
          if (regErrorLogin.test(reply)) {
            this.badLoginOrPass();
          }
          else
            this.reportError();
				}
				else {
          var volumeused = regused.exec(reply);
          this.usedVolume = Math.round((volumeused[1]*1+volumeused[2]*1)*1000/1024)/1000;
          this.totalVolume = this.getCapacity();
          this.remainingDays = getInterval("firstDayNextMonth");
          this.update(true);
				}
					
		}	
				
}
