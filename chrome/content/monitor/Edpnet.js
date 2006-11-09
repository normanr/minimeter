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
        
         if( !regUsed.test(reply) ){
             this.notLoggedin();
         } else {
        
            var volume = null;
            var volumeused = 0;
            var volumetotal = 0;
            
            if(regUsed.test(reply) && regAllowed.test(reply)){
              volumeused = regUsed.exec(reply);
              volumetotal = regAllowed.exec(reply);
            }

             this.usedVolume = Math.round((volumeused[1] /1024)*1000)/1000;
             this.totalVolume = this.getCapacity() == 10 ? volumetotal[1] /1024 : this.getCapacity();

         }
         this.update(true);
    }
}

