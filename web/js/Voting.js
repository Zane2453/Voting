/**
 * Created by kuan on 2018/8/26.
 */


var setCookie = function(cname, cvalue, exdays) {
    // cookie example: "question1=answer1;expires=Thu, 01 Jan 1970 00:00:00 UTC"
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
};

var getCookie = function(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return decodeURIComponent(c.substring(name.length, c.length));
        }
    }
    return "";
};

var setRatio = function(id){
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
            for(var i = 0; i < data.ratio.length; i++){
                (function(index){
                    $("button").each(function () {
                        if ($(this).css("background-color") == data.ratio[index].color) {
                            var r = Math.round((data.ratio[i].count / data.total) * 100, 1);
                            $(this).find("span").html(r.toString() + "%");
                        }
                    });
                }(i));
            }
            $(".badge").css("display", "block");
        }
    });
};

$(document).ready(function(){
    var id = location.pathname.split("/").pop().substr(0,16),
        answer = getCookie(id);
    if((answer != "" && (anonymous == true)) ||
        (va != undefined && (anonymous == false)) ) {
        if(anonymous)
            $("#chooseAswer").text("你的答案: " + answer);
        else
            $("#chooseAswer").text("你的答案: " + va);
        setRatio(id);
        return ;
    }
    else if((answer == "" && (anonymous == true)) ||
        (va == undefined && (anonymous == false)) )
        $("button").prop('disabled', false);

    $("button").click(function(){
        //store user answer
        var text = $(this).data('datac');
        $("#chooseAswer").text("你的答案: " + text);
        if(anonymous)
            setCookie(id, encodeURIComponent(text), 30);
        $("button").prop('disabled', true);
        $.ajax({
            type: "POST",
            url: location.origin + "/postA",
            cache: false,
            // dataType: 'json',
            data: JSON.stringify({
                id: id,
                color: $(this).css("background-color")
            }),
            contentType: "application/json",
            error: function(e) {
                console.log(e);
            },
            success: function () {
                setRatio(id);
            }
        });

    });

});

