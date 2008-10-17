
function Chello(username, password) {
    this.username = username;
    this.password = password;
    this.image = "chello.png";
    this.name = "Chello";
    this.url = "https://www.upc.cz"
}

Chello.prototype = new Monitor();

Chello.prototype.callback = function(step, reply) {
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
					
		}
				
}
