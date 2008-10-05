function Eleven(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "eleven.png";
    this.name = "E-leven";
    this.url = "https://secure.belcenter.com/Adsl.FrontEnd.FR/My.Adsl.Eleven/";
}

Eleven.prototype = new Belcenter();