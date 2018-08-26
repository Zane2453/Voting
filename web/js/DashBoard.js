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
                $("#total").html("Total: " + data.total);
                var str = "";
                for(var i = 0; i < data.ratio.length; i++){
                    if(data.total != 0) {
                        str += "<p class='a'>" + data.ratio[i].a + ": " +
                            (Math.round(parseFloat(data.ratio[i].count / data.total) * 100)).toString() + "\%</p>";
                    }
                    else{
                        str += "<p class='a'>" + data.ratio[i].a + ": 0" + "\%</p>";
                    }
                }
                $("#options").html(str);
                $(".a").each(function(i){
                    $(this).css("color", data.ratio[i].color);
                });
                console.log(data);
            }
        });
    }, 1000);
});
