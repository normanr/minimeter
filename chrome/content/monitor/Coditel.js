function Coditel(username, password) {
    this.username = username;
    this.password = password;
    this.image = "coditel.png"; // does not belong in class
    this.name = "Coditel";
    this.url = "http://www.coditel.net/FRcm_counters.asp?ESN="+this.username+"&action=CheckESN&SubmitButton=Requête";
}

Coditel.prototype = new Monitor();

Coditel.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
          http_get("http://www.coditel.net/FRcm_counters.asp?ESN="+this.username+"&action=CheckESN&SubmitButton=Requête", this, 2);
          break;
          
       case 2:
         reply = unescape(reply);
         var regUsed = /ce mois : ([0-9,]*) GBytes<\/b><br><hr width="80%">/;
        
         if(!regUsed.test(reply)){
           this.reportError();
           break;
         } 
         else {
           var volumeused = 0;
            
           volumeused = regUsed.exec(reply);

           this.usedVolume = volumeused[1].replace(",",".")*1;
           this.remainingDays = getInterval("firstDayNextMonth");
         }
         this.update(true);
    }
}

