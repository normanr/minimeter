
function Karneval(username, password) {
    this.username = username;
    this.password = password;
    this.image = "karneval.png";
    this.name = "Karneval";
    this.url = "https://www.upc.cz"
}

Karneval.prototype = new Monitor();

Karneval.prototype.callback = function(step, reply) {
  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      var postdata = "username="+this.username+"&password="+this.password+"&submit.x=0&submit.y=0&login-form-type=pwd&hid_username=unauthenticated&hid_tamop=login&hid_errorcode=0x00000000&hid_referer=null";
      http_post('https://www.upc.cz/pkmslogin.form?REDIRURL=https%3A%2F%2Fwww.upc.cz%2F%3Faction%3Dlogin%26loc%3D1', postdata,this, 2);
      break;
    case 2:
      reply = unescape(reply);
      var regErrorLogin=/Chybn/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      this.reportError(step, this.name, escape(reply));
      //http_get('https://muj.karneval.cz/internet/traffic.php', this, 3);
      break;
    case 3:
      reply = unescape(reply);
      //var reg = /traffic.php' class='list2'>([0-9.]*) (G|M)B \/ ([0-9.]*) (G|M)B <\/a>/;
      var reg = /<td>([0-9,]*)(G|M)B<\/td>\s*<td>([0-9,]*)(G|M)B/;
      if(!reg.test(reply)){
        this.reportError(step, this.name, escape(reply));
      } else {
        var volume = reg.exec(reply);
        s1 = new String (volume[1]);
        s1 = s1.replace (",", ".");
        s2 = new String (volume[3]);
        s2 = s2.replace (",", ".");					
                    
        var download = Math.round(100 * s1 / (volume[2]=='M' ? 1024 : 1)) / 100;
        var upload   = Math.round(100 * s2 / (volume[4]=='M' ? 1024 : 1)) / 100;

        this.extraMessage = "P\u0159ijat\u00E1 data: " + download +" GB\nOdeslan\u00E1 data: " + upload +" GB";
        this.usedVolume = (download > upload) ? download : upload;
        this.totalVolume = this.getCapacity();
        
        this.update(true);
      }
        
  }	
				
}
