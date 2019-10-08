
$(document).ready(function(){
    var socketIo = io();
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
});
