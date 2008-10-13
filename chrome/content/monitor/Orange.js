function Orange(username, password) {
    this.username = username;
    this.password = password;
    this.image = "orange.png"; // does not belong in class
    this.name = "Orange";
    this.url = "http://compte.orange.fr/moninternet/compte/bin/compte.cgi";
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
		 http_get('http://compte.orange.fr/moninternet/compte/bin/compte.cgi', this, 2);
		 break;
       case 2:
         reply = unescape(reply);
         var regRemaining = /consommer :&nbsp;<\/td>\s*<td class="ligne_orange"><strong><nobr>([0-9.]*) Go/;
         var regTotal = /mois :&nbsp;<\/td>\s*<td class="ligne_blanche"><strong><nobr>([0-9.]*) Go/;
         var regSupp = /dit :&nbsp;<\/td>\s*<td class="ligne_blanche"><strong><nobr>([0-9.]*) Go/;
        
         if(!regRemaining.test(reply) || !regTotal.test(reply)){
             this.reportError(step, this.name, escape(reply));
             break;
         } else {
             var volume = null;
             var volumeremain = 0;
             var volumetotal = 0;
             var volumesupp = 0;
            
             volumeremain = regRemaining.exec(reply);
             volumetotal = regTotal.exec(reply);
             if(regSupp.test(reply)) {
               volumesupp = regSupp.exec(reply);
               volumesupp = volumesupp[1];
             }

             this.usedVolume = Math.round(volumetotal[1]*1000 - volumeremain[1]*1000 + volumesupp*1000)/1000;
             this.totalVolume = volumetotal[1];

         }
         this.remainingDays = getInterval("firstDayNextMonth");
         this.update(true);
    }
}
