/**
 * Created by kuan on 2018/8/26.
 */

$(document).ready(function(){
    var id = location.pathname.split("/").pop().substr(0,16);
    $("button").click(function(e){
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
});

