function Edpnet(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "edpnet.png"; // does not belong in class
    this.name = "EDPnet";
    this.url = "http://www.edpnet.be/traffic2.aspx?R=1&ID="+this.username+"&PWD="+this.password;
}

Edpnet.prototype = new Monitor();

Edpnet.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
          http_get("http://www.edpnet.be/traffic2.aspx?R=1&ID="+this.username+"&PWD="+this.password, this, 2);
          break;
          
       case 2:
         reply = unescape(reply);
         var regUsed = /<span id="lblTotal2"><b>([0-9]*) MB<\/b><\/span>/;
         var regAllowed = /<span id="lblAllowed2"><b>([0-9]*) MB<\/b><\/span>/;
        
         if(!regUsed.test(reply) || !regAllowed.test(reply)){
           var regErrorLogin=/(Invalid username or password|Nom d'utilisateur et mot de passe incorrect|Incorrecte gebruikersnaam en wachtwoord)/;
           if (regErrorLogin.test(reply)) {
             this.badLoginOrPass();
             break;
           }
           else {
             this.unknownError(step,this.name);
             break;
           }
         } 
         else {
           var volumeused = 0;
           var volumetotal = 0;
            
           volumeused = regUsed.exec(reply);
           volumetotal = regAllowed.exec(reply);

           this.usedVolume = Math.round(volumeused[1]/1024*1000)/1000;
           this.totalVolume = this.getCapacity() == 10 ? volumetotal[1] /1024 : this.getCapacity();
           
           if(this.usedVolume > this.totalVolume)
             this.amountToPay = Math.round((this.usedVolume - this.totalVolume)*0.25*100)/100 + " EUR";
         }
         http_get("http://www.edpnet.be/traffic2_history.aspx", this, 3);
         //http_get("http://www.edpnet.be/traffic2_details.aspx", this, 3);
         break;
         
       case 3:
         reply = unescape(reply);
         //var regDateEnd = /<td>([0-9/]*)<\/td><td>&nbsp;<\/td><td align=right>([0-9,]*) MB<\/td><td>&nbsp;<\/td><td align=right>([0-9,]*) MB<\/td><\/tr><\/table>/; // traffic2_details.aspx
         var regDateEnd = /<tr><td>([0-9]*)\//;
         
         
         //var regDateEnd = /Upload<\/b><\/td><\/tr><tr><td>([0-9/]*)&nbsp;-&nbsp;([0-9/]*)<\/td>/; //traffic2_history.aspx
      
         if( regDateEnd.test(reply) ){
           regDateEnd = regDateEnd.exec(reply);
           this.remainingDays = getInterval("nearestOccurence", regDateEnd[1]);
         }
         this.update(true);
    }
}

