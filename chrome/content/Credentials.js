function Credentials(url){
  this.url = url;
}

Credentials.prototype.store = function(username, password) {
  
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
      var loginInfo = new nsLoginInfo(this.url, this.url, null,
                            username, password, null, null);
      try {
        var logins = myLoginManager.findLogins({}, this.url, this.url, null);
        var userName = logins[0].username;
        var userPass = logins[0].password;
        myLoginManager.removeLogin(logins[0]);
      } catch (e) {}
      myLoginManager.addLogin(loginInfo);
    }
}

Credentials.prototype.load = function() {

    var CC_passwordManager = Components.classes["@mozilla.org/passwordmanager;1"];
    var CC_loginManager = Components.classes["@mozilla.org/login-manager;1"];
    var userName;
    var userPass;
    
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
      var logins = myLoginManager.findLogins({}, this.url, this.url, null);
      userName = logins[0].username;
      userPass = logins[0].password;
    }

    return {username:userName, password:userPass};
}

