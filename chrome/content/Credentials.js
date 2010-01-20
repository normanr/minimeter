if (typeof Minimeter == "undefined")
  var Minimeter =  {
    prefs: Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService).getBranch("extensions.minimeter."),
};

Minimeter.Credentials = function (url){
  this.url = url;
}

Minimeter.Credentials.prototype.store = function(username, password) {
  
    var CC_passwordManager = Components.classes["@mozilla.org/passwordmanager;1"];
    var CC_loginManager = Components.classes["@mozilla.org/login-manager;1"];
    
    if (CC_passwordManager != null) { // < Firefox 3
      var passwordManager = CC_passwordManager.createInstance();
      var passwordManagerI = passwordManager.QueryInterface(Components.interfaces.nsIPasswordManagerInternal);
      passwordManager = passwordManager.QueryInterface(Components.interfaces.nsIPasswordManager);
    
      try{
        var host = {value:""};
        var user =  {value:""};
        var pw = {value:""};
        
        passwordManagerI.findPasswordEntry(this.url, "", "", host, user, pw);
        passwordManager.removeUser(this.url, user.value);
      } catch (e) { }
  
      if (password != null) {
        passwordManager.addUser(this.url, username, password);
      }
    }
    else if (CC_loginManager!= null) { // Firefox 3 and above
      var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                   Components.interfaces.nsILoginInfo,
                                                   "init");
      var myLoginManager = CC_loginManager
                            .getService(Components.interfaces.nsILoginManager);
      if (password == '') // workaround for empty password limitation
        password = ' ';
      var loginInfo = new nsLoginInfo(this.url, this.url, null, username, password, '', '');
//new nsLoginInfo(hostname, formSubmitURL, httprealm, username, password,usernameField, passwordField);
//                 !=null      null?          null?    !=null    !=null
//(hostname!=null && username!=null && password!=null) && httprealm!=null || formSubmitURL!=null 
      try {
        var logins = myLoginManager.findLogins({}, this.url, this.url, null);
        if (logins != "")
          myLoginManager.removeLogin(logins[0]);
      } catch (e) {}
      myLoginManager.addLogin(loginInfo);
    }
}

Minimeter.Credentials.prototype.load = function() {

    var CC_passwordManager = Components.classes["@mozilla.org/passwordmanager;1"];
    var CC_loginManager = Components.classes["@mozilla.org/login-manager;1"];
    var userName = '';
    var userPass = '';
    
    if (CC_passwordManager != null) { // < Firefox 3
      var passwordManager = CC_passwordManager
                            .createInstance(Components.interfaces.nsIPasswordManagerInternal);
        
      var host = {value:""};
      var user =  {value:""};
      var pw = {value:""}; 
    
      try {
        passwordManager.findPasswordEntry(this.url, "", "", host, user, pw);
        userName = user.value;
        userPass = pw.value;
      } catch(e){}
    }
    else if (CC_loginManager!= null) { // Firefox 3 and above
      var myLoginManager = CC_loginManager
                           .getService(Components.interfaces.nsILoginManager);
      var logins = myLoginManager.findLogins({}, this.url, null, this.url);
      if (logins.length > 0) { // upgrade from old credentials
        userName = logins[0].username;
        userPass = logins[0].password;
        var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                     Components.interfaces.nsILoginInfo,
                                                     "init");
        var loginInfo = new nsLoginInfo(this.url, this.url, null,
                            userName, userPass, '', '');
        myLoginManager.removeLogin(logins[0]);
        myLoginManager.addLogin(loginInfo);
      }
      else {
        logins = myLoginManager.findLogins({}, this.url, this.url, null);
        if (logins.length > 0) {
          userName = logins[0].username;
          userPass = logins[0].password;
          if (userPass == ' ') // workaround for empty password limitation
            userPass = '';
        }
      }
      
    }

    return {username:userName, password:userPass};
}

