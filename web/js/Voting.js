/**
 * Created by kuan on 2018/8/26.
 */

var id = getQuestionnaireId(),
    questionIdx = 0,
    cookieId,
    question = '題目: <%= q %>',
    options = '<% for(var i = 0; i < o.length; i++){ %> <div>\
               <button type="button" class="option btn" style="background-color: \
               <%= o[i].color %>" data-datac="<%= o[i].description %>" disabled>\
               <%= o[i].description %>\
               <span class="badge badge-light" style="display:none"></span>\
               </button></div> <% } %>';

var setCookie = function(cname, cvalue, exdays) {
    // cookie example: "question1=answer1;expires=Thu, 01 Jan 1970 00:00:00 UTC"
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
};

var getCookie = function(cname) {
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
};
var checkVoted = function(){
    cookieId = id + "_" + questionIdx;

    var answer = getCookie(cookieId);
    if((answer != "" && (anonymous == true)) ||
        (va != undefined && (anonymous == false)) ) {
        if(anonymous)
            $("#chooseAswer").text("你的答案: " + answer);
        else
            $("#chooseAswer").text("你的答案: " + va);
        $(".option").prop('disabled', true);
        setRatio(id);
        return;
    }
    else if((answer == "" && (anonymous == true)) ||
        (va == undefined && (anonymous == false)) ){
        $(".option").prop('disabled', false);
        $("#chooseAswer").text("你的答案:  尚未選擇");
    }
};
var setRatio = function(id){
    $.ajax({
        type: "GET",
        url: location.origin + "/getR/" + id + "/" + questionIdx,
        cache: false,
        dataType: 'json',
        contentType: "application/json",
        error: function(e){
            console.log(e);
        },
        success: function (data) {
            for(var i = 0; i < data.ratio.length; i++){
                (function(index){
                    $(".option").each(function () {
                        if ($(this).css("background-color") == data.ratio[index].color) {
                            var r = Math.round(data.ratio[i].count / data.total*1000)/10;
                            $(this).find("span").html(r.toString() + "%");
                        }
                    });
                }(i));
            }
            $(".badge").css("display", "block");
        }
    });
};

var getNextQuestion = function(){
    $("#next").css('visibility', 'hidden');
    $.ajax({
        type: "GET",
        url: location.origin + "/getNxtQ/" + id + "/" + questionIdx,
        cache: false,
        dataType: 'json',
        contentType: "application/json",
        error: function(e) {
            console.log(e);
        },
        success: function (nxtQ) {
            if(nxtQ.question.questionIdx == questionIdx-1){
                $("#interact").css('visibility', 'hidden');
                $("#end").css('visibility', 'visible');
            }
            else{
                jQuery.fn.slideLeftHide = function(speed, callback) {
                    $("#interact").animate({
                        width: "hide",
                        paddingLeft: "hide",
                        paddingRight: "hide",
                        marginLeft: "hide",
                        marginRight: "hide"
                    }, speed, callback);
                }(200, function(){
                    $("#question").html(ejs.render(question, {q: nxtQ.question.description}));
                    $("#options").html(ejs.render(options, {o: nxtQ.options}));
                    checkVoted();
                    $(".option").click(voteAnswer);
                    jQuery.fn.slideLeftShow = function(speed, callback) {
                        $("#interact").animate({
                            width: "show",
                            paddingLeft: "show",
                            paddingRight: "show",
                            marginLeft: "show",
                            marginRight: "show"
                        }, speed, callback);
                    }(200);
                });
            }
        }
    });
};
var voteAnswer = function(){
    //store user answer
    var text = $(this).data('datac');
    $("#chooseAswer").text("你的答案: " + text);
    if(anonymous) {
        cookieId = id + '_' + questionIdx;
        setCookie(cookieId, encodeURIComponent(text), 30);
    }
    $(".option").prop('disabled', true);
    $.ajax({
        type: "POST",
        url: location.origin + "/postA",
        cache: false,
        // dataType: 'json',
        data: JSON.stringify({
            id: id,
            questionIdx: questionIdx,
            color: $(this).css("background-color")
        }),
        contentType: "application/json",
        error: function(e) {
            console.log(e);
        },
        success: function () {
            setRatio(id);
        }
    });
};
$(document).ready(function(){
    var socketIo = io();
    $(".option").click(voteAnswer);
    $("#next").click(getNextQuestion);

    socketIo.emit('CUR_Q');
    socketIo.on('CUR_Q', (curQ)=>{
        if( (id !== curQ.questionnaireIdx) ||
            (questionIdx === curQ.questionIdx && questionIdx !== 0))
            return;
        questionIdx = curQ.questionIdx;
        getNextQuestion();
    });

    socketIo.on('NEXT', (curQ)=>{
        if(id !== curQ.questionnaireIdx)
            return;
        questionIdx++;
        $("#next").css('visibility', 'visible');
    });

});





