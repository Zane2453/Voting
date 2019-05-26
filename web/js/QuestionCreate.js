/**
 * Created by kuan on 2018/8/25.
 */
$(document).ready(function(){
    //initial value for base64TextArea
    $('#base64TextArea').val("");
    //load picture handler
    $("#uploadImage").change(function(){
        getImageBase64str( this );
    });
    //submit btn
    $("#submit").click(function(){
       var question = $("#question").val(),
           anonymous = !$('#anonymous').is(":checked");
       if(question.trim().length != 0){
           var options = [];
           $(".option").each(function(){
               var temp = $(this).val().trim();
               if (temp.length == 0)
                   return;
               else
                   options.push({
                       description: $(this).val(),
                       color: $(this).css("color")
                   });
           });
           question = $("#question").val();
           if(options.length > 1){
                $('#submit').prop('disabled', true);

                //get base64str
                var base64ImgStr = $('#base64TextArea').val();
                if(base64ImgStr == ""){
                    base64ImgStr = "none";
                }

                $.ajax({
                    type: "POST",
                    url: "/postQ",
                    cache: false,
                    // dataType: 'json',
                    data: JSON.stringify(
                    {
                        question : question, 
                        options : options, 
                        anonymous : anonymous, 
                        image: base64ImgStr
                    }),
                    contentType: "application/json",
                    error: function(e){
                        //location.reload();
                        console.log(e);
                    },
                    success: function (id) {
                        window.location = "/dashboard/" + id;
                    }
                });
           }

           else
               alert("至少輸入兩個選項!");
       }
       else
           alert("題目不能為空!");
   });
});

var getImageBase64str = function(input) {
    if(input.files && input.files[0]){
        var FR = new FileReader();
        FR.onload = function(e) {
            //set thumbnail
            $('#thumbnail').attr( "src", e.target.result);
            $('#thumbnail').attr( "style", "display:block" );
            $('#thumbnail_row').attr( "style", "display:block" );
            
            var width, 
                height, 
                image = new Image();

            image.src = e.target.result;
            image.onload = function(){
                if(image.width > 600){
                    width = 600;
                    height = (width / image.width) * image.height;
                    var canvas = $('<canvas width="' + width + '" height="' + height + '"></canvas>')[0];
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0, width, height);

                    //set compressed img to tmp textarea storage
                    var imagedata = canvas.toDataURL();
                    $('#base64TextArea').val(imagedata);
                    //console.log(imagedata);
                }
                else{
                    //set original img to tmp textarea storage
                    $('#base64TextArea').val(image.src);
                    //console.log(image.src);
                }
            };
        };
        FR.readAsDataURL(input.files[0]);
    }
    else{
        //close thumbnail
        $('#thumbnail').attr("style", "display:none");
        $('#thumbnail_row').attr("style", "display:none");

        //flush base64str in textarea
        $('#base64TextArea').val("");
    }
};
