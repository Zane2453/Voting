/**
 * Created by kuan on 2018/8/26.
 */

$(document).ready(function(){
    // cookie example: "question1=answer1;expires=Thu, 01 Jan 1970 00:00:00 UTC"
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires;
    }

    function getCookie(cname) {
        console.log("now cookie: ", document.cookie);
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
    }

    //[TODO] after user success voting, should save this questionid to cookie
    //[TODO] refresh this page, should show the latest voting result about this question
    var id = location.pathname.split("/").pop().substr(0,16);

    //check cookie
    var answer, already_done = 0;
    answer = getCookie(id);
    if(answer != ""){
        already_done = 1;
        console.log("find cookie: ", answer);
        $("h5").text("答案: " + answer);
    }
    else{
        already_done = 0;
    }

    if(already_done == 1){ //user already answered this question
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
                                var r = Math.round((data.ratio[i].count / data.total) * 100);
                                $(this).find("span").html(r.toString() + "%");
                            }
                        });
                    }(i));
                }
                $("button").prop('disabled', true);
                $(".badge").css("display", "block");
            }
        });
    }
    else{ //user fist time answer this question
        $("button").click(function(e){
            //store user answer
            var text = $(this).text().split('5')[0];
            var res = encodeURIComponent(text);
            console.log("user choose answer:/",res, "/")

            $("button").prop('disabled', true);
            $.ajax({
                type: "POST",
                url: location.origin + "/postA",
                cache: false,
                // dataType: 'json',
                data: JSON.stringify({id:id, color: $(this).css("background-color")}),
                contentType: "application/json",
                error: function(e) {
                    console.log(e);
                },
                success: function () {
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
                            //add this result to cookie
                            setCookie(id, res, 30);
                            console.log("save cookie: ", document.cookie);
                            $("h5").text("答案: " + text);

                            for(var i = 0; i < data.ratio.length; i++){
                                (function(index){
                                    $("button").each(function () {
                                        if ($(this).css("background-color") == data.ratio[index].color) {
                                            var r = Math.round((data.ratio[i].count / data.total) * 100);
                                            $(this).find("span").html(r.toString() + "%");
                                        }
                                    });
                                }(i));
                            }
                            $(".badge").css("display", "block");
                        }
                    });
                }
            });

        });
    }

});

