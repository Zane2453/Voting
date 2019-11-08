/**
 * Created by kuan on 2018/8/26.
 */

let id = getQuestionnaireId(),
    questionIdx = -1,
    cookieId,
    question = '<%= q %>',
    options = '<% for(let i = 0; i < o.length; i++){ %> \
               <button type="button" class="option btn" \
               aid="<%= o[i].aid %>" data-datac="<%= o[i].description %>" onclick=voteAnswer(this)>\
               <%= o[i].description %> \
               <span class="badge badge-light" style="display:none"></span>\
               </button> <% } %>',
    isStart = false,
    isEnd = false,
    pauseVoted = false;

let setCookie = function(cname, cvalue, exdays) {
    // cookie example: "question1=answer1;expires=Thu, 01 Jan 1970 00:00:00 UTC"
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
};

let getCookie = function(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return decodeURIComponent(c.substring(name.length, c.length));
        }
    }
    return "";
};

let checkVoted = function(){
    cookieId = id + "_" + questionIdx;

    let answer = getCookie(cookieId);
    if((answer !== "" && (anonymous === true)) ||
        (va !== undefined && (anonymous === false)) ) {
        $("#next_msg").text("已收到您的投票");
        $("#next").css('visibility', 'visible');
        //Keep the chosen answer bright
        $("#options").children('button').each(function() {
            if(answer == $(this).data('datac')){
                $(this).prop('disabled', false);
                $(this).removeAttr('onclick');
                //$(this).css('font-weight', 'bold');
            }else{
                $(this).prop('disabled', true);
            }
        });

        //setRatio(id);
        return;
    }
    else if((answer === "" && (anonymous === true)) ||
        (va === undefined && (anonymous === false)) ){
        if(pauseVoted){
            $("#next_msg").text("投票時間終了");
            $("#next").css('visibility', 'visible');
            $(".option").prop('disabled', true);
        }else{
            $(".option").prop('disabled', false);
        }
        //$("#chooseAswer").text("你的答案:  尚未選擇");
    }
};

let setRatio = function(id){
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
            // remove percentage
        }
    });
};

let getNextQuestion = function(){
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
            if(nxtQ.question.questionIdx === questionIdx-1){
                $("#question").html(ejs.render(question, {q: ""}));
                $("#options").html(ejs.render(options, {o: []}));
                $("#interact").css('visibility', 'hidden');
                $("#end").css('visibility', 'visible');
                isEnd = true;
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
                    $("#options").prop('disabled', false);
                    checkVoted();
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

let voteAnswer = function(obj){
    //store user answer
    let text= $(obj).data('datac'),
        aid = $(obj).attr('aid');
    //$("#chooseAswer").text("你的答案: " + text);
    if(anonymous) {
        cookieId = id + '_' + questionIdx;
        setCookie(cookieId, encodeURIComponent(text), 30);
    }
    $("#options").children('button').each(function() {
        if(text == $(this).data('datac')){
            $(this).prop('disabled', false);
            $(this).removeAttr('onclick');
        }else{
            $(this).prop('disabled', true);
        }
    });

    $.ajax({
        type: "POST",
        url: location.origin + "/postA",
        cache: false,
        // dataType: 'json',
        data: JSON.stringify({
            id: id,
            questionIdx: questionIdx,
            // send answer's id
            aid: aid
        }),
        contentType: "application/json",
        error: function(e) {
            console.log(e);
        },
        success: function () {
            $("#next_msg").text("已收到您的投票");
            $("#next").css('visibility', 'visible');
            setRatio(id);
        }
    });
};

let startPoll = function(){
    isStart = true;
    $("#welcome").css('visibility', 'hidden');
    $("#interact").css('visibility', 'visible');
    getNextQuestion();
};

$(document).ready(function(){
    let socketIo = io();
    //$("#next").click(getNextQuestion);
    $("#startBtn").click(startPoll);
    socketIo.emit('CUR_Q');
    socketIo.on('START', (curQ)=>{
        if(id !== curQ.questionnaireIdx)
            return;
        questionIdx = 0;
        startPoll();
    });
    socketIo.on('CUR_Q', (curQ)=>{
        if(id !== curQ.questionnaireIdx){
            $("#welcome").css('visibility', 'visible');
            return;
        }
        if(questionIdx === curQ.questionIdx)
            return;
        pauseVoted = curQ.pauseVoted;
        questionIdx = curQ.questionIdx;
        startPoll();
    });
    socketIo.on('NEXT', (curQ)=>{
        if(id !== curQ.questionnaireIdx)
            return;
        pauseVoted = curQ.pauseVoted;
        questionIdx = curQ.questionIdx;
        if(isStart && !(isEnd))
            getNextQuestion();
    });
    socketIo.on('PAUSE', (curQ)=>{
        pauseVoted=true;
        checkVoted();
    });
});
