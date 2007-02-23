function Orange(username, password) {
    this.username = username;
    this.password = password;
    this.image = "orange.png"; // does not belong in class
    this.name = "Orange";
    this.url = "http://compte.orange.fr/wanadoo_et_moi/compte/bin/compte.cgi";
}

Orange.prototype = new Monitor();

Orange.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
		 http_get('http://compte.orange.fr/wanadoo_et_moi/compte/bin/compte.cgi', this, 2);
		 break;
       case 2:
         reply = unescape(reply);
         var regRemaining = /consommer<\/td>\s*<td class="LigneOrange"><div align="right"><strong><nobr>([0-9.]*) Go<\/nobr>/;
         var regTotal = /mois<\/td>\s*<td class="LigneBlanche"><div align="right"><strong><nobr>([0-9.]*) Go<\/nobr>/;
         var regSupp = /dit<\/td>\s*<td class="LigneBlanche"><div align="right"><strong><nobr>([0-9.]*) Go<\/nobr>/;
        
         if( !regRemaining.test(reply) ){
             this.notLoggedin();
             break;
         } else {
        
            var volume = null;
            var volumeremain = 0;
            var volumetotal = 0;
            var volumesupp = 0;
            
            if(regRemaining.test(reply) && regTotal.test(reply)){
              volumeremain = regRemaining.exec(reply);
              volumetotal = regTotal.exec(reply);
              volumesupp = regSupp.exec(reply);
            }

             this.usedVolume = (volumetotal[1]*1000 - volumeremain[1]*1000 + volumesupp[1]*1000)/1000;
             this.totalVolume = Math.round(volumetotal[1]);

         }
         this.remaining = getInterval("firstDayNextMonth");
         this.update(true);
    }
}