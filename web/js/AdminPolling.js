
$(document).ready(function(){
    var socketIo = io();
    var qIdx = 0;
    $("#start").click(()=>{
        socketIo.emit('START', $("#questionnaireIdx").val());
    });
    $("#next").click(()=>{
        $('#qIdx').text(++qIdx);
        socketIo.emit('NEXT');
    });
});
