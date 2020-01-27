var socketIo = io();

function close_msgModal(){
    $("#my_modal_backdrop").removeClass("my_modal_backdrop");
    $("#messageModal").modal("hide");
}

$(document).ready(function(){
    var qIdx = 0;
    $("#start").click(()=>{
        socketIo.emit('START', $("#questionnaireIdx").val());
    });
    $("#next").click(()=>{
        if(!$("#qIdxInput").val()){
            $('#qIdx').text(++qIdx);
            socketIo.emit('NEXT');
        }else{
            qIdx = $("#qIdxInput").val();
            $('#qIdx').text($("#qIdxInput").val());
            socketIo.emit('NEXT', $("#qIdxInput").val());
        }
    });
    $("#pause").click(()=>{
        socketIo.emit('PAUSE');
    });
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
    $('.control').on('click', function(){
        // show control board
        $("#messageModal").modal("show");
    });
    $('.create').on('click', function(){
        // show popup window
        $("#qnModal").modal("show");
    });
    $('#qnModal_add').on('click', function(){
        let questionnaire_name = $.trim($('#qnModal_qnname').val());

        if(questionnaire_name == ""){
            alert("Questionnaire name cannot be empty!");
        }else{
            $.ajax({
                type: 'POST',
                url: location.origin + "/postQN",
                cache: false,
                data: JSON.stringify({
                    description: questionnaire_name,
                    anonymous: true,
                    image: ""
                }),
                contentType: "application/json",
                error: function(e){
                    alert("something wrong");
                    console.log(e);
                },
                success: function(data){
                    location.replace(location.origin + "/admin/questionnaire/" + data);
                }
            });
        }
    });
    $('.delete').on('click', function(){
        questionnaireId = $(this).attr('qnid');
        // check whether QN is connected 
        if($(this).parent().siblings(".alert-secondary").find(".register").text() == "已連接"){
            alert("This Questionnaire is connected!");
        }
        else{
            var check=confirm("確定要刪除嗎")
            if(check == true){
                $.ajax({
                    type: "POST",
                    url: location.origin + "/admin/deleteQN",
                    cache: false,
                    data: JSON.stringify({
                        questionnaireId: questionnaireId
                    }),
                    contentType: "application/json",
                    error: function(e){
                        alert("something wrong");
                        console.log(e);
                    },
                    success: function(data){
                        location.reload();
                    }
                });
            }
        }
    });    
});