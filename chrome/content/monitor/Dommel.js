
function Dommel(username, password) {
		this.version = "1.0";
    this.username = username;
    this.password = password;
    this.image = "dommel.png"; // does not belong in class
    this.name = "Dommel";
    this.url = "https://crm.schedom-europe.net/index.php";
}

Dommel.prototype = new Monitor();

Dommel.prototype.check = function() {
		this.state = this.STATE_BUSY;
		this.notify();
		this.callback(1);
}


Dommel.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }

 
		switch(step)
		{
			default:
			case 1:
				var postdata = "op=login&username="+this.username+"&password="+this.password+"&new_language=english";
				http_post('https://crm.schedom-europe.net/index.php', postdata,this, 2);
				break;
			case 2:
			  reply = unescape(reply);
        var regErrorLogin=/your login is incorrect/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
			  http_get('https://crm.schedom-europe.net/user.php?op=view&tile=mypackages', this, 3);
			  break;
			case 3:
			  reply = unescape(reply);
			  var servid = /servid=([0-9]+)&/;
			  var client_id = /client_id=([0-9]+)'/;
			    var servidValue = servid.exec(reply);
			    var client_idValue = client_id.exec(reply);
			  if( !servid.test(reply) || !client_id.test(reply) ){
					this.unknownError(step,this.name);
			  } else {
			    var servidValue = servid.exec(reply);
			    var client_idValue = client_id.exec(reply);
  			  http_get("https://crm.schedom-europe.net/include/scripts/linked/dslinfo/dslinfo.php?servid="+servidValue[1]+"&password="+this.password+"&client_id="+client_idValue[1], this, 4);
  			}
			  break;
			case 4:
			  reply = unescape(reply);

 			  var reg_connection_type = /<td><b>type :<\/b><\/td>\s*<td>(broadband|mediumband)<\/td>/;
 			  //var reg_broad_DL = /broadband download : ([0-9\.]+) gb/;
 			  //var reg_broad_UP = /broadband upload : ([0-9\.]+) gb/;
 			  var reg_broad_TOTAL = /total traffic downloaded in broadband: ([0-9\.]+) gb/;
 			  //var reg_medium_DL = /medium\/smallband download : ([0-9\.]+) gb/;
 			  //var reg_medium_UP = /medium\/smallband upload : ([0-9\.]+) gb/;
 			  //var reg_medium_TOTAL = /total transferred in medium\/smallband : ([0-9\.]+) gb/;
 			  //var reg_overall = /overall transferred during the current period : ([0-9\.]+) gb/;
 			  var reg_broad_REMAINING = /remaining : <\/b>([0-9\.]+) gb/;
        var reg_remaining = /days remaining: ([0-9]+)/;
        
			  if( !reg_connection_type.test(reply)) {

					this.unknownError(step,this.name);

			  } else {

 			   // Grab connection type (broadband|mediumband)
 			   var connection_typeValue = reg_connection_type.exec(reply);

 			   // Grab remaining days before reset
         if( !reg_remaining.test(reply) ) {
           this.remaining = null;
         } else {
           var remainingValue = reg_remaining.exec(reply);
           this.remaining = remainingValue[1];
         }

  			 // Grab common info to broadband & mediumband
 			   //var broad_DLValue = reg_broad_DL.exec(reply);
 			   //var broad_UPValue = reg_broad_UP.exec(reply);
 			   var broad_TOTALValue = reg_broad_TOTAL.exec(reply);  

  			 // Grab info in broadband
			   if( connection_typeValue[1] == "broadband") {
			  
    		 // Grab remaining volume before mediumband
    		 var remainingVolume = 0;
         if( reg_broad_REMAINING.test(reply) ) {
  			  var broad_REMAININGValue = reg_broad_REMAINING.exec(reply);
          remainingVolume = (broad_REMAININGValue[1]*1).toFixed(2);
         }
          	
         //var down = (broad_DLValue[1]*1).toFixed(2);
         //var up = (broad_UPValue[1]*1).toFixed(2);
         this.usedVolume = (broad_TOTALValue[1]*1).toFixed(2);
         this.totalVolume = ((this.usedVolume*1) + (remainingVolume*1)).toFixed(2);
         //this.extraMessage = "Download: " + down +" GB, Upload: " + up +" GB";
        	this.extraMessage = "Download: " + this.usedVolume +" GB\nConnection type : " + connection_typeValue[1];
    		 http_get('https://crm.schedom-europe.net/index.php?op=logout', this, 5);
 			  
    		} 
 			  // Grab info in mediumband
    		else if( connection_typeValue[1] == "mediumband") {
  			  
    		  //var medium_DLValue = reg_medium_DL.exec(reply);
    		  //var medium_UPValue = reg_medium_UP.exec(reply);
    		  //var medium_TOTALValue = reg_medium_TOTAL.exec(reply);
    		  //var overallValue = reg_overall.exec(reply);
    
         	//var down1 = (broad_DLValue[1]*1).toFixed(2);
         	//var up1 = (broad_UPValue[1]*1).toFixed(2);
         	//var down2 = (medium_DLValue[1]*1).toFixed(2);
         	//var up2 = (medium_UPValue[1]*1).toFixed(2);
         	//var overall = (overallValue[1]*1).toFixed(2);
         	//this.usedVolume = (broad_TOTALValue[1]*1 + medium_TOTALValue[1]*1).toFixed(2);
         	//this.totalVolume = this.usedVolume;
         	//this.extraMessage = "Broadband download : " + down1 +" GB, Up: " + up1 +" GB\n" + "Mediumband download : " + down2 +" GB, Up: " + up2 +" GB\n" + "Overall transfer : " + overall +" GB";

        	this.usedVolume = (broad_TOTALValue[1]*1).toFixed(2);
          this.totalVolume = this.usedVolume;
        	this.extraMessage = "Download: " + this.usedVolume +" GB\nConnection type : " + connection_typeValue[1];
      		 http_get('https://crm.schedom-europe.net/index.php?op=logout', this, 5);
      			  
      	} else {
    			this.unknownError(step,this.name);
    		}
      }
      break;					
			case 5:
     		this.update(true);	
		}	
}
