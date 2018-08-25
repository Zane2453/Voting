/**
 * Created by kuan on 2018/8/25.
 */
$(document).ready(function() {
    var id = location.pathname.split("/").pop().substr(0,16);
    var url = location.origin + "/"
        + id;
    var qrcode = new QRCode("qrcode", {
        text: url,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    setInterval(function(){
        $.ajax({
            type: "GET",
            url: location.origin + "/getRatio/" + id,
            cache: false,
            dataType: 'json',
            contentType: "application/json",
            error: function(e){
                console.log(e);
            },
            success: function (data) {
                $("#total").html("total: " + data.total);
                var str = "";
                for(var i = 0; i < data.ratio.length; i++){
                    str += "<p>" + data.ratio[i].a +  ": " +
                        (data.ratio[i].count/data.total).toString() + "</p>";
                }
                $("#options").html(str);
                console.log(data);
            }
        });
    }, 1000);
});
