$(document).ready(function(){
    $('.register').on('click', function(){
        questionnaireId = $(this).attr('qnid');
        questionnaire_now = $(this);

        $.ajax({
            type: "POST",
            url: location.origin + "/admin/resetQN",
            cache: false,
            data: JSON.stringify({
                questionnaireId: questionnaireId
            }),
            contentType: "application/json",
            error: function(e){
                alert("something wrong");
                console.log(e);
            },
            success: function(data){
                $('.register').each(function(index) {
                    $(this).text("連接");
                });
                questionnaire_now.text("已連接");
            }
        });
    });
});