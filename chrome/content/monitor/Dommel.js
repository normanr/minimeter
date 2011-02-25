Minimeter.Dommel = function(username, password) {
  this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
  this.password = password;
  this.image = "dommel.png";
  this.name = "Dommel";
  this.url = "https://crm.schedom-europe.net/index.php";
  this.servid = null;
  if(username.indexOf(",") > 0)
    this.servid = username.substr(username.indexOf(",")+1);
}

Minimeter["Dommel"].prototype = new Minimeter.Monitor();

Minimeter["Dommel"].prototype.check = function() {
  this.state = this.STATE_BUSY;
  this.notify();
  this.callback(1);
}

Minimeter["Dommel"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }
  
  switch(step)
  {
    default:
    case 1:
      var postdata = "op=login&username="+this.username+"&password="+this.password+"&new_language=english";
      Minimeter.http_post('https://crm.schedom-europe.net/index.php', postdata,this, 2);
      break;
    case 2:
      reply = decodeURIComponent(reply);
      var regConnOk = /my packages|mijn pakketten/;
      var regErrorLogin=/your login is incorrect|uw paswoord werd niet aanvaard/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      if (!regConnOk.test(reply))
        this.reportError(step, this.name, encodeURIComponent(reply));
      else
        Minimeter.http_get('https://crm.schedom-europe.net/user.php?op=view&tile=mypackages', this, 3);
      break;
    case 3:
      reply = decodeURIComponent(reply);
      var servid = /servid=([0-9]+)&/;
      var client_id = /client_id=([0-9]+)'/;
      
      var servidValue = servid.exec(reply);
      var client_idValue = client_id.exec(reply);
      if( !servid.test(reply) || !client_id.test(reply) ){
        this.reportError(step, this.name, encodeURIComponent(reply));
      } else {
        var servidValue = null;
        if(this.servid != null)
          servidValue = this.servid;
        else {
          servidValue = servid.exec(reply);
          servidValue = servidValue[1];
        }
        
        var client_idValue = client_id.exec(reply);
        Minimeter.http_get("https://crm.schedom-europe.net/include/scripts/linked/dslinfo/dslinfo.php?servid="+servidValue+"&password="+this.password+"&client_id="+client_idValue[1], this, 4);
      }
      break;
    case 4:
      reply = decodeURIComponent(reply);
      
      var reg_homeconnect = /homeconnect/;
      var reg_connection_type = /<td><b>type :<\/b><\/td>\s*<td>(broadband|mediumband)<\/td>/;
      var reg_broad_TOTAL = /total traffic (downloaded|transferred) in broadband: ([0-9\.]+) gb/;
      var reg_real_traffic = /<b>real traffic that was transferred <\/b> was<b> ([0-9\.]+) gb<\/b>/;
      var reg_real_upload = /your line nor the ([0-9\.]+) gb uploadtraffic/;
      var reg_broad_REMAINING = /remaining in broadband: <\/b>([0-9\.]+) gb/;
      var reg_remainingDays = /days remaining: ([0-9]+)/;
    
      if(reg_homeconnect.test(reply))
        this.setFlatRateWithoutInfos();
      else {
        
        if( !reg_connection_type.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
        } else {
          // Grab connection type (broadband|mediumband)
          var connection_typeValue = reg_connection_type.exec(reply);
          
          var gb = " " + Minimeter.getunitPrefix("GB"); // Unit as selected in options and locale
      
          // Grab remaining days before reset
          if( !reg_remainingDays.test(reply) ) {
            this.remainingDays = null;
          } else {
            var remainingDaysValue = reg_remainingDays.exec(reply);
            this.remainingDays = remainingDaysValue[1]*1;
          }
      
          // Grab common info to broadband & mediumband
          var broad_TOTALValue = reg_broad_TOTAL.exec(reply);  
          var real_upload = 0;
          if( reg_real_traffic.test(reply) ) {
            var real_trafficValue = reg_real_traffic.exec(reply);
            var real_traffic= real_trafficValue[1]*1;
          } 
          if( reg_real_upload.test(reply) ) {
            var real_uploadValue = reg_real_upload.exec(reply);
            real_upload= real_uploadValue[1]*1;
          }
  
          // Grab info in broadband
          if( connection_typeValue[1] == "broadband") {
        
            // Grab remaining volume before mediumband
            var remainingVolume = 0;
            if( reg_broad_REMAINING.test(reply) ) {
              var broad_REMAININGValue = reg_broad_REMAINING.exec(reply);
              remainingVolume = broad_REMAININGValue[1]*1;
            }
      
            this.usedVolume = broad_TOTALValue[2]*1;
            this.totalVolume = this.usedVolume + remainingVolume;
            this.extraMessage = "Counted Traffic: " + (this.usedVolume).toFixed(2) + gb;
            if (typeof(real_traffic) != 'undefined')
              this.extraMessage += "\nTotal Traffic: " + real_traffic.toFixed(2) + gb + " (Upload: " + real_upload.toFixed(2) + gb + ")";
            this.extraMessage += "\nConnection type : " + connection_typeValue[1];
            Minimeter.http_get('https://crm.schedom-europe.net/index.php?op=logout', this, 5);
          }
          // Grab info in mediumband
          else if( connection_typeValue[1] == "mediumband") {
      
            this.usedVolume = broad_TOTALValue[2]*1;
            this.totalVolume = this.usedVolume;
            this.extraMessage = "Counted Traffic: " + (this.usedVolume).toFixed(2) + gb;
            if (typeof(real_traffic) != 'undefined')
              this.extraMessage += " (Real: " + real_traffic.toFixed(2) + gb + ")";
            this.extraMessage += "\nConnection type : " + connection_typeValue[1];
            Minimeter.http_get('https://crm.schedom-europe.net/index.php?op=logout', this, 5);
          } else {
            this.reportError(step, this.name, encodeURIComponent(reply));
          }
        }
        break;
      }
    case 5:
      this.update(true);
  }   
}
