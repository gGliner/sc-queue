var trackTemplateString = $('#track-template').html();
var trackTemplate = Handlebars.compile(trackTemplateString);
var updateTimeout;

var cid = '3255288e8a5aee620ee0a40f179cb73d';

SC.initialize({
  client_id: cid
});

function lightenBackground(){
    $( "#input" ).css({backgroundColor: "#f38f3d"});
}

function darkenBackground(){
    $( "#input" ).css({backgroundColor: "#f28328"});
}

var queue = [];
var currentTrack = 0;
var trackId = 0;
var currentSound;
var playState = false;
var currentTime = "0:00";
var firstPlay = true;

$(document).on('click', "#add", function(){
    addTrack();
});

$("#input").keydown(function (e) {
    if (e.keyCode == 13) {
        addTrack();
        $("#input").blur();
    }
});

$(document).keydown(function(e){
    if (e.keyCode==32){
        playPause();
    }
});

$(document).on('click', "#playpause", function(){
    playPause();
});

$(document).on('click', "#prev", function(){
    if(playState){
        prev(true);
    }
    else {
        prev(false);
    }
});

$(document).on('click', "#next", function(){
    if(playState){
        next(true);
    }
    else {
        next(false);
    }
});

$(document).on('click','.clear',function() {
    clear(this.id);
});

function addTrack() {
    return $.ajax({
        url: "http://api.soundcloud.com/resolve.json?url=" +
            document.getElementById("input").value +
            "&client_id=" + cid,
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Please enter a valid Soundcloud url.");
            $( "#input" ).val("");
        }
    }).then(function(response){
        response.trackId = trackId;
        response.trackDuration = millisToMinutesAndSeconds(response.duration);
        if(response.title.length > 18){
            response.title = response.title.substring(0, 18) + "...";
        }
        $( "#queue" ).append(trackTemplate(response));
        queue.push(response);
        $( "#input" ).val("");
        trackId++;
    })
}

function playPause() {
    if(playState){
        pause();
    }
    else{
        play();
    }
}


function next(cont) {
    document.getElementById("time").innerHTML = " ";
    if(queue.length > 0){
        $("#" + queue[currentTrack].trackId).toggleClass("inactive");
    }
    if(currentSound){
        currentSound.pause();
        currentSound.seek(0);
    }
    $( "#playpause" ).css({backgroundImage: "url(play.png)"});
    firstPlay = true;
    currentTrack++;
    if(cont){
        play();
    }
}

function prev(cont) {
    document.getElementById("time").innerHTML = " ";
    if(queue.length > 0){
        $("#" + queue[currentTrack].trackId).toggleClass("inactive");
    }
    if(currentSound){
        currentSound.pause();
        currentSound.seek(0);
    }
    $( "#playpause" ).css({backgroundImage: "url(play.png)"});
    firstPlay = true;
    currentTrack--;
    if(cont){
        play();
    }
}

function play() {
    if(currentTrack < queue.length && currentTrack >= 0 && queue.length != 0){
        $( "#playpause" ).css({backgroundImage: "url(pause.png)"});
        var trackUrl = "/tracks/" + queue[currentTrack].id;
        $("#" + queue[currentTrack].trackId).removeClass("inactive");
        SC.stream(trackUrl).then(function(player){
                playState = true;
                currentSound = player;
                playState = true;
                player.play();
                player.on("finish", function(){
                    next(true);
                });
                player.on("time", function(){
                    if(currentTrack < queue.length && currentTrack >= 0){
                        document.getElementById("time").innerHTML = millisToMinutesAndSeconds(currentSound.currentTime()) + " / " + millisToMinutesAndSeconds(queue[currentTrack].duration);
                    }
                });
        });
    }
    else if(queue.length > 0){
        ("$time").innerHTML = " ";
        playState = false;
        currentTrack = 0;
        $("#" + queue[currentTrack].trackId).toggleClass("inactive");
        firstPlay = false;
    }
    else {
        ("$time").innerHTML = " ";
        playState = false;
        currentTrack = 0;
        firstPlay = true;
    }
}

function pause() {
    if(currentSound){
        $( "#playpause" ).css({backgroundImage: "url(play.png)"});
        currentSound.pause();
        playState = false;
    }

}

function clear(track) {
    var toClear = parseInt(track.substring(5));
    for(var i=0; i<queue.length; i++){
        if(queue[i].trackId == toClear){
                queue.splice(i,1);
                document.getElementById("time").innerHTML = " ";
                if(i == currentTrack){
                    if(playState){
                        next(true);
                    }
                    else {
                        next(false);
                    }
                }
                break;
        }
    }
    if(queue.length == 0){
        pause();
        firstPlay = true;
        currentTrack = 0;
    }
    $("#"+toClear).remove();
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
