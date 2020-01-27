let id = getQuestionnaireId();

let displayR = function(){
    var divs = document.querySelectorAll('.options');
    [].forEach.call(divs, function(div) {
        // do whatever
        $.ajax({
            type: "GET",
            // url: location.origin + "/getR/" + id + "/" + div.getAttribute('qid'),
            url: location.origin + "/getP/" + div.getAttribute('qid'),
            cache: false,
            dataType: 'json',
            contentType: "application/json",
            error: function(e){
                console.log(e);
            },
            success: function (data) {
                var str = "";
                for(var i = 0; i < data.ratio.length; i++){
                    if(data.total != 0) {
                        str += "<p class='a' " + "style='color: " + data.ratio[i].color + "' >" + data.ratio[i].a + ": " +
                            (Math.round(parseFloat(data.ratio[i].count) / parseFloat(data.total)*1000)/10).toString() + "\%</p>";
                    }
                    else{
                        str += "<p class='a' " + "style='color: " + data.ratio[i].color + "' >" + data.ratio[i].a + ": 0" + "\%</p>";
                    }
                }
                div.innerHTML = str;
            }
        });
      });
};

$(document).ready(function(){
    // display Percentage
    displayR();
    setInterval(displayR, 1000);

    $('.create').on('click', function(){
        location.href = location.origin + "/admin/questionnaire/" + id + "/create";
    });

    $('.edit').on('click', function(){
        location.href = location.origin + "/admin/questionnaire/" + id + "/edit/" + $(this).attr("qid");
    });

    $('.delete').on('click', function(){
        var self = this;
        var question_id = $(this).attr("qid");

        console.log(question_id);

        if(confirm("確定要刪除嗎?")){
            //ajax
            $.ajax({
                type: "POST",
                url: location.origin + "/admin/deleteQ",
                cache: false,
                data: JSON.stringify(
                {
                    id : question_id
                }),
                contentType: "application/json",
                error: function(e){
                    alert("something wrong");
                    console.log(e);
                },
                success: function(data){
                    //remove this human from table
                    $(self).parent().parent().parent().parent().remove();
                    location.reload();
                }
            });
        }
        else{
            return false;
        }
    });
});