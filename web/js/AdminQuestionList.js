$(document).ready(function(){
    $('.delete').on('click', function(){
        var self = this;
        var question_id = $(this).parent().parent().find('a').attr('href').split("/")[3];

        console.log(question_id);

        if(confirm("確定要刪除嗎?")){
            //ajax
            $.ajax({
                type: "POST",
                url: location.origin + "/QuestionDelete",
                cache: false,
                data: JSON.stringify(
                {
                    delete_id : question_id
                }),
                contentType: "application/json",
                error: function(e){
                    alert("something wrong");
                    console.log(e);
                },
                success: function(data){
                    //remove this human from table
                    $(self).parent().parent().parent().parent().remove();

                    alert("刪除成功!!");
                    location.reload();
                }
            });
        }
        else{
            return false;
        }
    });

    $('.edit').on('click', function(){
        var question_id = $(this).parent().parent().find('a').attr('href').split("/")[2],
            edit_url = location.origin;

        console.log(question_id);

        window.location.replace("http://stackoverflow.com");
    });
});