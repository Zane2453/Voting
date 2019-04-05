/**
 * Created by kuan on 2018/8/25.
 */
$(document).ready(function(){
   var qId = _uuid();
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
               $.ajax({
                   type: "POST",
                   url: "/postQ",
                   cache: false,
                   // dataType: 'json',
                   data: JSON.stringify({id:qId, question: question, options: options, anonymous: anonymous}),
                   contentType: "application/json",
                   error: function(e){
                       location.reload();
                       console.log(e);
                   },
                   success: function () {
                       var component = location.href.split("/");
                       while(true){
                           if(component[component.length-1] == "")
                               component.pop();
                           else
                               break;
                       }
                       component = component.join("/");
                       window.location = component + "/" +qId;
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

var _uuid = function() {
    var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

