Minimeter.Bouygues = function (username, password) {
  this.username = username;
  this.password = password;
  this.image = "bouygues.png";
  this.name = "Bouygues Telecom";
  this.url = "http://www.espaceclient.bouyguestelecom.fr/ECF/jsf/client/conso-factures/details-conso/viewDetailsConso.jsf";
}

Minimeter["Bouygues"].prototype = new Minimeter.Monitor();

Minimeter["Bouygues"].prototype.callback = function(step, reply) {
  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      Minimeter.http_get("https://www.espaceclient.bouyguestelecom.fr/ECF/jsf/submitLogin.jsf", this, 2);
      break;
      
    case 2:
      reply = decodeURIComponent(reply);
      var regIdCorrelation = /name="idCorrelation" value="([^"]*)"/;
      var regVoirConso = /\/ECF\/jsf\/client\/conso-factures\/details-conso\/viewDetailsConso\.jsf/;
      if (!regIdCorrelation.test(reply)) {
        if (regVoirConso.test(reply)) // déja connecté
          Minimeter.http_get("http://www.espaceclient.bouyguestelecom.fr/ECF/jsf/client/conso-factures/details-conso/viewDetailsConso.jsf", this, 4);
        else
          this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      var idCorrelation = regIdCorrelation.exec(reply);
      var postdata = "manageLogin%3Aiwebf_input_choix_sas=forfaitmobile&j_username="+this.username+"&j_password="+this.password+"&application_name=ESPACE_CLIENT_WEB_FORFAIT&idCorrelation="+encodeURIComponent(idCorrelation[1]);
      Minimeter.http_post('https://www.espaceclient.bouyguestelecom.fr/ECF/jsf/j_security_check', postdata,this, 3);
      break;
        
    case 3:
      reply = decodeURIComponent(reply);
      var regErrorLogin=/erreur de saisie/;
      var regVoirConso = /\/ECF\/jsf\/client\/conso-factures\/details-conso\/viewDetailsConso\.jsf/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      if (!regVoirConso.test(reply)) {
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      Minimeter.http_get("http://www.espaceclient.bouyguestelecom.fr/ECF/jsf/client/conso-factures/details-conso/viewDetailsConso.jsf", this, 4);
      break;
      
    case 4:
      reply = decodeURIComponent(reply);
      var regErrorLogin=/erreur de saisie/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      var regused=/<strong><span>([0-9.]*) (Mo|Go)<\/span><\/strong>/;
      var regDateEnd = /dateEmissionFacture">([0-9]+)\/([0-9]+)\/([0-9]+)/;
      var regtotal = /(?:illimit|3G\+ 24\/24)/;
      if (!regused.test(reply) || !regtotal.test(reply) || !regDateEnd.test(reply)) {
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      var volumeused = regused.exec(reply);
      if (volumeused[2] == "Mo")
        volumeused[1] = Math.round(volumeused[1]/1.024)/1000;
      this.usedVolume = volumeused[1];

        
      this.totalVolume = 5;
      
      var dateEnd = regDateEnd.exec(reply);
      dateEnd = new Date(dateEnd[3], dateEnd[2], dateEnd[1]);
      dateEnd.setTime(86400000 + dateEnd.getTime());
      this.remainingDays = Minimeter.getInterval("nearestOccurence", dateEnd.getDate());
        
      this.update(true);
  }
}
