Minimeter.Happymany = function(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "happymany.png"; // does not belong in class
    this.name = "Happymany";
    this.url = "https://secure.happymany.be/Report/TrafficVodslReportForm.aspx";
    this.contrat = null;
    if(username.indexOf(",") > 0)
      this.contrat = username.substr(username.indexOf(",")+1);
}

Minimeter["Happymany"].prototype = new Minimeter.Monitor();

Minimeter["Happymany"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
         this.extraMessage = '';
         var postdata = "USERNAME="+this.username+"&PASSWORD="+this.password+"&submit1=Continuer";
         Minimeter.http_post('https://secure.happymany.be/scripts/Login_action_new.asp', postdata,this, 2);
         break;
       case 2:
         reply = decodeURIComponent(reply);
         var regErrorLogin = /Failed Login/;
         var regAdrQuota = /https:\/\/secure.happymany.be\/Report\/([0-9A-Za-z_\-.?=]*)&Report=TrafficVodslReportForm.aspx/;
         if (regErrorLogin.test(reply)) {
           this.badLoginOrPass();
           break;
         }
         else {
           if(!regAdrQuota.test(reply)) {
             this.reportError(step, this.name, encodeURIComponent(reply));
             break;
           }
           else {
             var adrQuota = regAdrQuota.exec(reply);
             Minimeter.http_get("https://secure.happymany.be/Report/"+adrQuota[1]+"&Report=TrafficVodslReportForm.aspx", this, 3);
           }
         }
         break;
         
       case 3:
         reply = decodeURIComponent(reply);
         var regVolume = "";
        if(this.contrat != null)
          regVolume = new RegExp('<td class="FormGridItem" align="center" style="font-weight:bold;">'+this.contrat+'<\/td><td class="FormGridItem" align="center">[0-9]*<\/td><td class="FormGridItem" align="center">[0-9]*<\/td><td class="FormGridItem" align="center">([0-9]*)<\/td><td class="FormGridItem" align="center">([0-9]*)<\/td>');
        else
          regVolume = /<td class="FormGridItem" align="center" style="font-weight:bold;">[0-9]*<\/td><td class="FormGridItem" align="center">[0-9]*<\/td><td class="FormGridItem" align="center">[0-9]*<\/td><td class="FormGridItem" align="center">([0-9]*)<\/td><td class="FormGridItem" align="center">([0-9]*)<\/td>/;
        
        
        
         if(!regVolume.test(reply)){
             this.reportError(step, this.name, encodeURIComponent(reply));
             break;
           }
         else {
           var volume;
           var costPerGB;
           var amountToPay;
            
           volume = regVolume.exec(reply);

           this.usedVolume = Math.round(volume[1]/1024*1000)/1000;
           this.totalVolume = Math.round(volume[2]/1024*1000)/1000;
           
           if(this.usedVolume > this.totalVolume) {
             if(this.totalVolume == 200)
               costPerGB = 50;
             else
              costPerGB = 1;
             amountToPay = Math.round((this.usedVolume - this.totalVolume)*costPerGB*100)/100;
             if(this.totalVolume == 200 && amountToPay>10)
               amountToPay = 10;
             
             this.amountToPay = amountToPay + " EUR";
           }
             
           this.remainingDays = Minimeter.getInterval("firstDayNextMonth");
           
           this.update(true);
            }

    }

}

