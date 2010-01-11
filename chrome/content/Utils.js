function JArray(){}

JArray.prototype = new Array();

JArray.prototype.getInd = function(value) {
        for (var i in this) {
                if (this[i] == value) {
                        return i;
                }
        }
};

JArray.prototype.contains = function(obj) {
        for (var i in this) {
                if (this[i]==obj) return true;
        }
        return false;
};

JArray.prototype.add = function(obj) {
        this.push(obj);
};

JArray.prototype.remove = function(value) {
        var ind=this.getInd(value);
        if (isNaN(ind)) {
                this.removeByIndex(ind);
        } else {
                this.splice(ind,1);
        }
};

JArray.prototype.clear = function() {
        for (var i in this) {
                this.splice(i,1);
        }
};


function getInterval(endDateText, dayNum){
  var nowDate = new Date();
  var interval = 0;
  if (endDateText == "firstDayNextMonth"){
    var dd = 1;
    var mm = nowDate.getMonth() + 1;
    var yyyy = nowDate.getFullYear();
  }
  else
    if (endDateText == "nearestOccurence"){
      var dd = nowDate.getDate();
      var mm = nowDate.getMonth();
      var yyyy = nowDate.getFullYear();
      if(dd >= dayNum) // date dépassée, donc reset le mois suivant
        mm++;
      dd = dayNum;
  }
  else{
    var dd = endDateText.substring(0,2);
    var mm = endDateText.substring(3,5);
    var yyyy = endDateText.substring(6,10);
  }
  if(mm == 12){
    mm = 0;
    yyyy++;
  }
  var endDate = new Date(yyyy,mm,dd);
  interval = Math.floor((endDate.getTime() - nowDate.getTime()) / (86400000)); // 86400000 = 24*60*60*1000
  return interval +1;
}

function getunitPrefix(unit){
  var prefs = null;
  var unitPrefix;
  var prefService = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefService);
  prefs = prefService.getBranch("extensions.minimeter.");
  useSI = prefs.getBoolPref('useSI');
  
  if(useSI && !monitor.useSIPrefixes) {
    if (unit == "GB")
      unitPrefix = getString("unit.GiB");
    else // == "MB"
      unitPrefix = getString("unit.MiB");
    }
    else {
      if (unit == "GB")
        unitPrefix = getString("unit.GB");
      else // == "MB"
        unitPrefix = getString("unit.MB");
    }
  return unitPrefix;
}


function http_get(purl, callback, step){
		monitor.error = "no";
		try{
  		var req = new XMLHttpRequest();
  
  		if(callback != null){
  			req.onreadystatechange = function(){
            if (req.readyState == 4){
              try{
                if(req.status == 500 || req.status == 503)
                  monitor.error = "server";
              }catch(ex){monitor.error = "connection";}
              if (req.responseText == '')
                monitor.error = "connection";
              callback.callback(step, encodeURIComponent(req.responseText));
            }
  			}
  		}
  		
      req.open("GET", purl, true, null, null);
		req.setRequestHeader('Cookie', 'usageConfirm=true');
		  req.send('');	
			
		}catch(ex){consoleDump(ex);}			
}

function http_post(purl, postdata, callback, step, cookie, contenttype){
		monitor.error = "no";
		try{
  		var req = new XMLHttpRequest();
  		
  		if(callback != null){
  			req.onreadystatechange = function(){
  				if (req.readyState == 4){
            try{
              if(req.status == 500 || req.status == 503)
                monitor.error = "server";
            }catch(ex){monitor.error = "connection";}
            if (req.responseText == '')
              monitor.error = "connection";
            if (callback == "reportError")
              monitor.reportError(null, null, null, encodeURIComponent(req.responseText));
            else
              if(callback != "errorPing")
                callback.callback(step, encodeURIComponent(req.responseText));
  				}
  			}
  		}
		
		
			req.open("POST", purl, true, null, null);
			if(contenttype != null)
        req.setRequestHeader('Content-Type', contenttype);
      else
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			if(cookie!=null)
        req.setRequestHeader('Cookie', cookie);
			req.send(postdata);		
			
		}catch(ex){consoleDump("Error posting: " + ex);}			
		
}	

function http_auth(purl, username, password, callback, step){

		try{
		  var listener = {
		    finished : function(data){
		  		if(callback != null){
						callback.callback(step, encodeURIComponent(data));    
		  		}
		    }
		  }
		   
		  httphost = purl.substr(7);
		  var end = httphost.indexOf("/");
		  path = httphost.substr(end);
			httphost = httphost.substr(0, end  );
			var auth = "\nAuthorization: Basic " + encode64(username+':'+password);
		  readAllFromSocket(httphost,80,"GET "+ path +" HTTP/1.0\nHost: " + httphost + auth + "\n\n",listener);
			
			
		}catch(ex){consoleDump(ex);}			
}

 /*
var Base64 = {
 
	encode : function (input) {
 
		input = Base64._utf8_encode(input);

		return output;
	},
 
	_utf8_encode : function (string) {

		return utftext;
	}
}
*/


function encode64(str) {
  // netusage code
  
	var b64 = [
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',   //  0 to  7
	'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',   //  8 to 15
	'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',   // 16 to 23
	'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',   // 24 to 31
	'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',   // 32 to 39
	'o', 'p', 'q', 'r', 's', 't', 'u', 'v',   // 40 to 47
	'w', 'x', 'y', 'z', '0', '1', '2', '3',   // 48 to 55
	'4', '5', '6', '7', '8', '9', '+', '/' ]; // 56 to 63

	var tfb = 0, res = '';
	
	// do a 3-to-4
	for (var i = 0; i < str.length; i += 3) {
		tfb = 0;
		tfb |= str.charCodeAt(i) << 16;
		if (i+1 < str.length) {
			tfb |= str.charCodeAt(i+1) << 8;
			if (i+2 < str.length)
				tfb |= str.charCodeAt(i+2);
		}
	
		res += b64[tfb >>> 18 & 63] 
			+ b64[tfb >>> 12 & 63] 
			+ b64[tfb >>> 6 & 63]
			+ b64[tfb & 63];
	}

	// take care of padding
	if (str.length % 3 == 1) {
		res = res.substr(0, 4*parseInt(str.length/3)+2)+'==';
	} else if (str.length % 3 == 2) {
		res = res.substr(0, 4*parseInt(str.length/3)+3)+'=';
	}

	return res;
}

function Minimeter_debug(va){
      const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
    .getService(Components.interfaces.nsIClipboardHelper);
      gClipboardHelper.copyString(va);
}

	function listObject(obj, s) {
    	var res = "List: " + obj + "\n";
    	for(var list in obj) {
    		if (list.indexOf(s) == -1)
    			res += list + ", ";
	    }

        consoleDump(res);
}

function consoleDump(aMessage) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage("Minimeter : " + aMessage);
}



function readAllFromSocket(host,port,outputData,listener)
{
  try {
    var transportService =
      Components.classes["@mozilla.org/network/socket-transport-service;1"]
        .getService(Components.interfaces.nsISocketTransportService);
    var transport = transportService.createTransport(null,0,host,port,null);

    var outstream = transport.openOutputStream(0,0,0);
    outstream.write(outputData,outputData.length);

    var stream = transport.openInputStream(0,0,0);
    var instream = Components.classes["@mozilla.org/scriptableinputstream;1"]
      .createInstance(Components.interfaces.nsIScriptableInputStream);
    instream.init(stream);

    var dataListener = {
      data : "",
      onStartRequest: function(request, context){},
      onStopRequest: function(request, context, status){
        instream.close();
        outstream.close();
        listener.finished(this.data);
      },
      onDataAvailable: function(request, context, inputStream, offset, count){
        this.data += instream.read(count);
      },
    };

    var pump = Components.
      classes["@mozilla.org/network/input-stream-pump;1"].
        createInstance(Components.interfaces.nsIInputStreamPump);
        
    pump.init(stream, -1, -1, 0, 0, false);
    pump.asyncRead(dataListener,null);
  } catch (ex){
    return ex;
  }
  return null;
}

function getString(id, altString) {
	var src = 'chrome://minimeter/locale/settings.properties';
  var stringBundleService =
     Components.classes["@mozilla.org/intl/stringbundle;1"]
     .getService(Components.interfaces.nsIStringBundleService);
  var retValue = "";
  try {
    retValue = stringBundleService.createBundle(src).GetStringFromName(id);
  }
  catch(ex) {
    if (altString != null)
      retValue = altString;
    else
      throw ex;
  }
 return retValue;
}
