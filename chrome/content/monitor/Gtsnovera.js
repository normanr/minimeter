// I can extend the totalVolume extension by purchased credit
// if anybody sends me the source code of the FUP page
// which contains list of purchased credit to:
//        michal .dot. matyska .@at@. seznam .dot. cz

function Gtsnovera(username, password) {
    this.username = username;
    this.password = password;
    this.image = "gtsnovera.png";
    this.name = "GTS Novera";
    this.url = "https://uzivatel.gtsnovera.cz/cgi-bin/netflow_graphs.pl";
}

Gtsnovera.prototype = new Monitor();

Gtsnovera.prototype.callback = function(step, reply) {
	if(this.aborted()){
		return;
	}

	switch(step) {
	default:
	case 1:
		var postdata = "login="+this.username+"&password="+this.password;
		http_post("https://uzivatel.gtsnovera.cz/cgi-bin/login.pl", postdata,this, 2);
		break;
	case 2:
		http_get("https://uzivatel.gtsnovera.cz/cgi-bin/fup.pl", this, 3);
		break;
	case 3:
		reply = unescape(reply);
		var reg = /<b>[ ]*([0-9]{1,3}\.[0-9]{3}) GB <\/b> [^0-9]* ([0-9.: ]*)<\/td>/;
		if(!reg.test(reply)){
			var reg_c = /[cC]ookie/;
			if (reg_c.test(reply)){
				this.callback(1,reply);
			} else {
				this.notLoggedin();
			}
		} else {
			var volume = reg.exec(reply);
			var volume2 = reg.exec(reply.substring(reply.indexOf(volume[1])));
			if (volume2[1]==0) {
				this.extraMessage = "\nStav k "+volume[2];
				this.totalVolume = this.getCapacity();
			} else {
				this.extraMessage = volume[1] +" + "+volume2[1]+" = "+(1*volume[1]+1*volume2[1])+" GB\n"+
						    "Stav k "+volume[2];
				this.totalVolume = this.getCapacity()+1*volume2[1];
				this.totalVolume = this.totalVolume.toFixed(3);
			}
			this.usedVolume = this.getCapacity()-1*volume[1];
			this.usedVolume = this.usedVolume.toFixed(3);
			this.update(true);
		}
	}
}
