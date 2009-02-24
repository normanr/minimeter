
function Internetsolutions(username, password) {
    this.username = username;
    this.password = password;
    this.image = "internetsolutions.png"; // does not belong in class
    this.name = "Internetsolutions";
    this.url = "http://users.isdsl.net/";
}

Internetsolutions.prototype = new Monitor();

Internetsolutions.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
			  var postdata = "username="+this.username+"&password="+this.password;
			  http_post(this.url + '?action=login', postdata,this, 2);
			  break;

			case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/User Name or Password/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        this.reportError(step, this.name, encodeURIComponent(reply)); //debug
			  //http_get(this.url + 'loginhistoryuid.php', this, 3);
			  break;

			case 3:
			  reply = decodeURIComponent(reply).replace(/\n/g, '');
			  var reg = /ACCOUNT HISTORY.*<td>([0-9]+):.*<td>([0-9\.]+) MB.*<td>([0-9\.]+) MB.*<td>([0-9\.]+) MB/;

			  if(!reg.test(reply)){
			    this.reportError(step, this.name, encodeURIComponent(reply));
			  } else {
			    var volume = reg.exec(reply);
			    var hours = volume[1];
			    var up = (volume[2]/1024).toFixed(2);
			    var down = (volume[3]/1024).toFixed(2);
			    var both = (volume[4]/1024).toFixed(2);
			    
			    if (isUseSI())
			        gb = getString("unitSI.GiB");
			    else
			        gb = getString("unit.GB");
			    
			    this.extraMessage = "Connected: " + hours + " hours\nUp: " + up +" " + gb + ", Down: " + down +" " + gb;
			    this.usedVolume = both;
			    this.totalVolume = this.getCapacity();
			    this.remainingDays = getInterval("firstDayNextMonth");

			    this.update(true);	
			  }

		}

}
