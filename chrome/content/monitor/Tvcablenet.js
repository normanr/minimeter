
function Tvcablenet(username, password) {
    this.username = username;
    this.password = password;
    this.image = "tvcablenet.png";
    this.name = "Tvcablenet";
    this.url = "http://mytvcablenet.tvcablenet.be/acces/acces-start.asp";
    this.urlstart = "http://mytvcablenet.tvcablenet.be";
}

Tvcablenet.prototype = new Voo();