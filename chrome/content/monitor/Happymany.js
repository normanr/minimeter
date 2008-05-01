function Happymany(username, password) {
    this.username = username;
    this.password = password;
    this.image = "happymany.png"; // does not belong in class
    this.name = "Happymany";
    this.url = "https://secure.happymany.be/Report/TrafficVodslReportForm.aspx";
}

Happymany.prototype = new Monitor();

Happymany.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
       default:
       case 1:
         this.extraMessage = '';
         var postdata = "USERNAME="+this.username+"&PASSWORD="+this.password+"&submit1=Continuer";
         http_post('https://secure.happymany.be/scripts/Login_action_new.asp', postdata,this, 2);
         break;
       case 2:
         reply = unescape(reply);
         var regErrorLogin = /Failed Login/;
         var regAdrQuota = /https:\/\/secure.happymany.be\/Report\/([0-9A-Za-z_\-.?=]*)&Report=TrafficVodslReportForm.aspx/;
         if (regErrorLogin.test(reply)) {
           this.badLoginOrPass();
           break;
         }
         else {
           if(!regAdrQuota.test(reply)) {
             this.notLoggedin();
             break;
           }
           else {
             var adrQuota = regAdrQuota.exec(reply);
             http_get("https://secure.happymany.be/Report/"+adrQuota[1]+"&Report=TrafficVodslReportForm.aspx", this, 3);
           }
         }
         break;
         
       case 3:
         reply = unescape(reply);
         
         var regVolume = /<td class="FormGridItem" align="center" style="font-weight:bold;">[0-9]*<\/td><td class="FormGridItem" align="center">[0-9]*<\/td><td class="FormGridItem" align="center">[0-9]*<\/td><td class="FormGridItem" align="center">([0-9]*)<\/td><td class="FormGridItem" align="center">([0-9]*)<\/td>/;
        
        
        
         if(!regVolume.test(reply)){
             this.unknownError(step,this.name);
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
             
           this.remainingDays = getInterval("firstDayNextMonth");
           
           this.update(true);
            }

    }

}

