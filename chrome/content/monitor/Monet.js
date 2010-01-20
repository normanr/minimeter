
Minimeter.Monet = function(username, password) {
    this.username = 'none';
    this.password = 'none';
    this.image = "monet.png";
    this.name = "Monet";
    this.url = 'http://www.monet-catv.info/ip_promet/index.php';
    
    // http://www.mocable.ba/paketi.php
    this.package = {
        'mopack': 0,
        'twopack': 10,
        'bigspeedy': 15,
        'superprofi': 20,
        'superflat': 0,
        'homesweethome': 2,
        'comboi': 5,
        'comboii': 5
    };
}

Minimeter["Monet"].prototype = new Minimeter.Monitor();

Minimeter["Monet"].prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    
		switch(step)
		{
			default:
			case 1:
				Minimeter.http_get(this.url,this, 2);
				break;
			case 2:
			  reply = decodeURIComponent(reply);
			  var regUsed = /Ukupni promet :  ([0-9\.]+) ([MG])B/;

			  if(!regUsed.test(reply)){
			     this.reportError(step, this.name, encodeURIComponent(reply));
          break;
			  }
			    var volume = regUsed.exec(reply);

			    if (volume[2] == 'M') {
            this.usedVolume = volume[1] / 1024;
          }
          else if (volume[2] == 'G') {
            this.usedVolume = volume[1];
          }
                
          var regPlan = /Paket: ([a-z]+)/;
          var p = regPlan.exec(reply);

          this.totalVolume = this.package[p[1]];
          this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
          this.update(true);	
	  }
}