Minimeter.Cellc = function(username, password) {
  this.username = username;
  this.password = password;
  this.image = "cellc.png"; // does not belong in class
  this.name = "Cellc";
  this.url = "https://ecare.cellc.co.za/ecare/mycellc/mobile/invoice/usage/";
}

Minimeter["Cellc"].prototype = new Minimeter.Monitor();

Minimeter["Cellc"].prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

  switch(step)
  {
    default:
    case 1:
      this.had_to_login = false;
      //dump(step + ": fetching index page\n");
      Minimeter.http_get("https://ecare.cellc.co.za/ecare/index.jsp", this, step + 1);
      break;

    case 2:
      reply = decodeURIComponent(reply);
      var regLoggedIn = /LOGOUT/;
      if (regLoggedIn.test(reply)) {
        //dump(step + ": already logged in, fetching usage: " + this.url + "\n");
        Minimeter.http_get(this.url, this, 6);
        break;
      }
      var regHidden=/<input\s+type="hidden"\s+name="([0-9A-Za-z\+/=]*)"\s+value="([0-9A-Za-z\+/=]*)"\s*\/?>/g;

      var postdata = "";
      var hidden = null;
      while (hidden = regHidden.exec(reply)) {
        postdata += encodeURIComponent(hidden[1]) + "=" + encodeURIComponent(hidden[2]) + "&";
      }

      if (!postdata) {
        //dump(step + ": error: " + reply + "\n");
        //this.update(false);
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      //dump(step + ": not logged in, fetching login page\n");
      Minimeter.http_post("https://ecare.cellc.co.za/ecare/post.do", postdata, this, step + 1);
      break;

    case 3:
      reply = decodeURIComponent(reply);
      var regHidden=/<input\s+type="hidden"\s+name="([0-9A-Za-z\+/=]*)"\s+value="([0-9A-Za-z\+/=]*)"\s*\/?>/g;

      var postdata = "";
      var hidden = null;
      while (hidden = regHidden.exec(reply)) {
        postdata += encodeURIComponent(hidden[1]) + "=" + encodeURIComponent(hidden[2]) + "&";
      }

      if (!postdata) {
        //dump(step + ": error: " + reply + "\n");
        //this.update(false);
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      postdata += "mobile="+this.username+"&password="+this.password;
      //dump(step + ": trying to login\n");
      Minimeter.http_post("https://sso.cellc.co.za/ca/POST.do", postdata, this, step + 1);
      break;

    case 4:
      reply = decodeURIComponent(reply);
      var regHidden=/<input\s+type="hidden"\s+name="([0-9A-Za-z\+/=]*)"\s+value="([0-9A-Za-z\+/=]*)"\s*\/?>/g;

      var postdata = "";
      var artifactFound = false;
      var hidden = null;
      while (hidden = regHidden.exec(reply)) {
        postdata += encodeURIComponent(hidden[1]) + "=" + encodeURIComponent(hidden[2]) + "&";
        if (hidden[1] == "SAMLart" && hidden[2]) {
          artifactFound = true;
        }
      }

      if (!postdata) {
        //dump(step + ": error: " + reply + "\n");
        //this.update(false);
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }

      if (!artifactFound) {
        //dump(step + ": could not login: " + reply + "\n");
        this.badLoginOrPass();
        break;
      }

      this.had_to_login = true;
      //dump(step + ": login successful, fetching index page\n");
      Minimeter.http_post("https://ecare.cellc.co.za/ecare/post.do", postdata, this, step + 1);
      break;

    case 5:
      reply = decodeURIComponent(reply);
      //dump(step + ": " + reply + "\n");
      var regLoggedIn = /LOGOUT/;
      if (!regLoggedIn.test(reply)) {
        //dump(step + ": error: " + reply + "\n");
        //this.update(false);
        this.reportError(step, this.name, encodeURIComponent(reply));
        break;
      }
      //dump(step + ": index fetched, fetching usage: " + this.url + "\n");
      Minimeter.http_get(this.url, this, step + 1);
      break;

  case 6:
    reply = decodeURIComponent(reply);
    var reg = /tableUsageInfo.*?<div[^>]*>\s*([^<]+?)\s*<\/div>.*?<td[^>]*>\s*([0-9,.]+)\s*<\/td>\s*<td[^>]*>\s*([0-9,.]+)\s*<\/td>\s*<td[^>]*>\s*([0-9,.]+)\s*<\/td>\s*<td[^>]*>\s*([0-9,.]+)\s*<\/td>/;
    var regCommas = /,/g;

    reply = reply.replace(/[\r\n]/g, "");
    if(!reg.test(reply)){
      //dump(step + ": error: " + reply + "\n");
      //this.update(false);
      this.reportError(step, this.name, encodeURIComponent(reply));
    } else {
      var volume = reg.exec(reply);
      //dump(step + ": match: " + volume + "\n");

      var bundle = volume[1].replace(/_/g, " ");
      var monthly = (volume[2].replace(/,/g, "")/1024).toFixed(2);
      var rollover = (volume[3].replace(/,/g, "")/1024).toFixed(2);
      var used = (volume[4].replace(/,/g, "")/1024).toFixed(2);
      var remaining = (volume[5].replace(/,/g, "")/1024).toFixed(2);

      var gb = " " + Minimeter.getunitPrefix("GB"); // Unit as selected in options and locale

      this.extraMessage = "Bundle: " + bundle + " \nRollover: " + rollover + gb;
      this.usedVolume = used;
      this.totalVolume = monthly;
      this.remainingDays = Minimeter.getInterval("firstDayNextMonth");

      this.update(true);
    }

    if (this.had_to_login)
    {
      //dump(step + ": logging out\n");
      Minimeter.http_get("https://ecare.cellc.co.za/ecare/OV/OVLogoutAction.do", this, step + 1);
    }
    break;

  case 7:
    reply = decodeURIComponent(reply); //.replace(/\n/g, '');
    //dump(step + ": logged out\n");
  }
}
