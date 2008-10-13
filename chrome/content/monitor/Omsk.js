
function Omsk(username, password) {
    this.username = username;
    this.password = password;
    this.image = "omsk.png"; // does not belong in class
    this.name = "?????? ????????????????";
    //this.url = ""
    this.measure = " $";
}

Omsk.prototype = new Monitor();

Omsk.prototype.check = function() {
		this.state = this.STATE_BUSY;
		this.notify();
		this.callback(1);
}


Omsk.prototype.callback = function(step, reply) {

    if(this.aborted()){
      return;
    }
    reply = unescape(reply);
		switch(step)
		{
			default:
			case 1:
				var postdata = "login="+this.username+"&pass="+this.password+"";
				http_post('http://giv.omsktele.com/stat/login.php', postdata,this, 2);
				break;
			case 2:
				http_get('http://giv.omsktele.com/stat/stat.xml',this, 3);
				break;
			case 3:
				var objDOMParser = new DOMParser();
				var doc = objDOMParser.parseFromString(reply, "text/xml");

			  if(!doc instanceof XMLDocument){
					this.reportError(step, this.name, escape(reply));
			  } else {
			  	var bofmonth = doc.getElementsByTagName("bofmonth")[0];
					this.totalVolume = bofmonth.getAttribute("bal")*1 + bofmonth.getAttribute("free_bal")*1 ;
					this.totalVolume = this.totalVolume.toFixed(3);
					
					var curbal = doc.getElementsByTagName("curbal")[0];
					this.usedVolume = curbal.getAttribute("bal")*1 + curbal.getAttribute("free_bal")*1 ;
					this.usedVolume = this.usedVolume.toFixed(3);
					
					var today = doc.getElementsByTagName("todaytraf")[0];
					var m = "\n????????: D " + today.getAttribute("iinet") + "/ U " + today.getAttribute("oinet") + " ??";
					m += "\n??????: D " + today.getAttribute("ilgot") + "/ U " + today.getAttribute("olgot") + " ??";
					m += "\n?????: D " + today.getAttribute("imedia") + "/ U " + today.getAttribute("omedia") + " ??";
					m += "\n?????????: D " + today.getAttribute("ilocal") + "/ U " + today.getAttribute("olocal") + " ??";
					
					var blocked = doc.getElementsByTagName("blocked")[0];
					if(blocked.getAttribute("state") == "yes"){
						m += "\n\n????????????: " + blocked.getAttribute("name") + "\n???? ??????????:"+ blocked.getAttribute("dt");
					}
					
					this.extraMessage = m;
      		this.update(true);	
        }
					
		}	
				
}
/*
<?xml version="1.0" encoding="WINDOWS-1251"?>

<stat>

<dt y="2005" m="7"/>
<bofmonth bal="12.003" free_bal="0.000002"/>
<curbal bal="-0.33" free_bal="0"/>
<todaytraf iinet="10241024" oinet="1024"  ilgot="4096" olgot="1024" imedia="128" omedia="128" ilocal="0" olocal="0"/>
<blocked state="yes" name="?????????? ??? ???????? ??????? ?? ?????" dt="2005.07.26" comment=""/>
</stat>
*/

