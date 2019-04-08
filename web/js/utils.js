function getLocationId(){
        var component = location.pathname.split("/");
    for(var i = component.length-1; i >= 0 ; i--)
        if(component[i] != "")
            break;
    console.log(component[i]);
    var id = component[i].substr(0,16);
	return id;
}
