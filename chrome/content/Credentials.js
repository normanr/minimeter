function Credentials(url){
  this.url = url;
}

Credentials.prototype.store = function(username, password) {
  

    var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].createInstance();
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

Credentials.prototype.load = function() {

    var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
      .createInstance(Components.interfaces.nsIPasswordManagerInternal);
      
    var host = {value:""};
    var user =  {value:""};
    var pw = {value:""}; 
  
    try {
      passwordManager.findPasswordEntry(this.url, "", "", host, user, pw);
    } catch(e){}



    return {username:user.value, password:pw.value};

   
}

