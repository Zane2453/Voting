exports.https = false;
if(exports.https){
    exports.httpServerOptions = {
        key:require("fs").readFileSync(""),
        cert:require("fs").readFileSync(""),
    };
}
exports.httpsPort = 443;
exports.httpPort = 80;
exports.db = ""; //mysql or sqlite
if(exports.db === "mysql") {
    exports.dbHost = "";
    exports.dbUser = "";
    exports.dbPassword = "";
}
exports.color = {
    option1Color: "rgb(255, 0, 0)",
    option2Color: "rgb(255, 165, 0)",
    option3Color: "rgb(189, 183, 107)",
    option4Color: "rgb(0, 128, 0)",
    option5Color: "rgb(0, 0, 255)",
    option6Color: "rgb(75, 0, 130)",
    option7Color: "rgb(128, 0, 128)",
    option8Color: "rgb(255, 0, 255)",
    option9Color: "rgb(102, 205, 170)",
    option10Color: "rgb(128, 128, 0)"
};
exports.IoTtalkVersion = "";
exports.IoTtalkURL = "";
exports.googleClientID = "";
exports.googleClientSecret = "";
exports.googleCallbackURL = "";
exports.facebookAPPID = "";
exports.facebookAPPSecret = "";
exports.facebookCallbackURL = "";
exports.adminAccount = "";
exports.adminPassword = "";
exports.useDisqus = false;
