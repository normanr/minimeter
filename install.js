 
// package constants
const DISPLAY_NAME   = "Minimeter";
const NAME           = "minimeter";
const KEY            = "/quota/" + NAME;
const GUID           = "{08ab63e1-c4bc-4fb7-a0b2-55373b596eb7}";
const VERSION        = "1.0.7.22";
const LOCALE_LIST    = ["fr-FR", "en-US", "nl-NL", "cs-CZ", "tr-TR"];
const JAR_FILE       = NAME + ".jar";
const PREFS_FILE     = "defaults/preferences/" + NAME + ".js";
const AUTOREG_FILE   = "defaults/.autoreg";
const CONTENT_FOLDER = "content/";

var err = null;

// begin the install
initInstall(NAME, KEY, VERSION);
  
var mainDir = getFolder("Profile", "extensions/" + GUID);
var chromeDir = getFolder(mainDir, "chrome");

addFile(KEY, VERSION, "chrome/"+JAR_FILE, chromeDir, null);

// Add the defaults folder
var defaultDir = getFolder(mainDir, "defaults");
addDirectory(KEY, VERSION, "defaults", defaultDir, null);
defaultDir = getFolder(getFolder("Program", "defaults"),"pref");
addFile(KEY, VERSION, PREFS_FILE, defaultDir, null);

//hack to make sure we register the component
var pgmDir = getFolder("Program");
addFile(KEY, VERSION, AUTOREG_FILE, pgmDir, null);
 
// Register the chrome URLs
registerChrome(Install.CONTENT | PROFILE_CHROME, getFolder(chromeDir, JAR_FILE), "content/");
registerChrome(Install.SKIN | PROFILE_CHROME, getFolder(chromeDir, JAR_FILE), "skin/");

for (var x = 0; x < LOCALE_LIST.length; x++)
  registerChrome(Install.LOCALE | PROFILE_CHROME, getFolder(chromeDir, JAR_FILE), "locale/"+LOCALE_LIST[x]+"/");

// Now install..
  err = performInstall();
  if ((err == SUCCESS) || (err == 999))
    alert(DISPLAY_NAME + " " + VERSION + " has been installed successfully!\nPlease restart to enable the extension.");
