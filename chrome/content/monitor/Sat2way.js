
Minimeter.Sat2way = function(username, password) {
  this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
  this.password = password;
  this.image = "sat2way.png";
  this.name = "Sat2way";
  this.url = "http://www.sat2way.fr/fr/user/home";
  this.conn = null;
  if(username.indexOf(",") > 0)
    this.conn = username.substr(username.indexOf(",")+1);
  this.useSIPrefixes = true;
}

Minimeter["Sat2way"].prototype = new Minimeter.Monitor();

Minimeter["Sat2way"].prototype.callback = function(step, reply) {
  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      var postdata = "login="+this.username+"&password="+this.password;
      var url = 'http://www.sat2way.fr/fr/user/minimeter' + (this.conn != null ? "?com="+this.conn : "");
      Minimeter.http_post(url, postdata, this, step+1);
      break;
        
    case 2:
      reply = decodeURIComponent(reply);
      var regErrorLogin=/Ce compte n'existe pas|Mot de passe incorrect/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      
      var reg1H = /1H: ([0-9.]*) \/ ([0-9]*) Mo \(([0-9.]*)%\)/;
      var reg4H = /4H: ([0-9.]*) \/ ([0-9]*) Mo \(([0-9.]*)%\)/;
      var reg1J = /1J: ([0-9.]*) \/ ([0-9]*) Mo \(([0-9.]*)%\)/;
      var reg1S = /1S: ([0-9.]*) \/ ([0-9]*) Mo \(([0-9.]*)%\)/;
      var reg4S = /4S: ([0-9.]*) \/ ([0-9]*) Mo \(([0-9.]*)%\)/;
      var regServerError = /temporairement indisponible/;
      
      if (!reg1H.test(reply) || !reg4H.test(reply) || !reg1J.test(reply) || !reg1S.test(reply) || !reg4S.test(reply)) {
        if (regServerError.test(reply))
          this.error = "server";
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      var reg1H = reg1H.exec(reply);
      var reg4H = reg4H.exec(reply);
      var reg1J = reg1J.exec(reply);
      var reg1S = reg1S.exec(reply);
      var reg4S = reg4S.exec(reply);
      
      this.usedVolume  = reg4S[1]/1000;
      this.totalVolume = reg4S[2]/1000;
      
      var mb = " " + Minimeter.getunitPrefix("MB"); // Unit as selected in locale

      
      this.extraMessage = 
        "       Dernière heure        : "+ reg1H[1].toString().replace(".",",") +" / " + reg1H[2].toString().replace(".",",") + mb + " (" + reg1H[3].toString().replace(".",",") + " %)\n" +
        "       4 dernières heures   : "+ reg4H[1].toString().replace(".",",") +" / " + reg4H[2].toString().replace(".",",") + mb + " (" + reg4H[3].toString().replace(".",",") + " %)\n" +
        "       Dernière journée      : "+ reg1J[1].toString().replace(".",",") +" / " + reg1J[2].toString().replace(".",",") + mb + " (" + reg1J[3].toString().replace(".",",") + " %)\n" +
        "       Dernière semaine      : "+ reg1S[1].toString().replace(".",",") +" / " + reg1S[2].toString().replace(".",",") + mb + " (" + reg1S[3].toString().replace(".",",") + " %)\n" +
        "       4 dernières semaines : "+ reg4S[1].toString().replace(".",",") +" / " + reg4S[2].toString().replace(".",",") + mb + " (" + reg4S[3].toString().replace(".",",") + " %)";
        
      this.update(true);
  }
}
