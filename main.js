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
var waveform;



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

$(document).on('click', '.track',function(e) {
    if(!$(e.target).is('.clear')){
        var isCurrent = false;
        realId = 0;
        for(var i=0; i<queue.length; i++){
            if(queue[i].trackId == this.id){
                realId = i;
                if(i == currentTrack){
                    isCurrent = true;
                    break;
                }
            }
        }

        if(!isCurrent){
            $("#" + queue[currentTrack].trackId).addClass("inactive");
            if(currentSound){
                currentSound.pause();
                currentSound.seek(0);
            }
            currentTrack = realId;
            $("#" + queue[currentTrack].trackId).toggleClass("inactive");
            document.getElementById("time").innerHTML = " ";
            firstPlay = true;
            play();
        }

        else if(isCurrent && firstPlay){
            play();
        }
        else if(isCurrent){
            currentSound.play();
        }
    }
});

function addTrack() {
    return $.ajax({
        url: "http://api.soundcloud.com/resolve.json?url=" +
            document.getElementById("input").value +
            "&client_id=" + cid,
        error: function(jqXHR, textStatus, errorThrown) {
            if(/^((?!chrome).)*safari/i.test(navigator.userAgent)){
                alert("Sorry- SoundCloudQueue does not currently support Safari. Please try again in a different browser.")
            }
            else {
                alert("Please enter a valid Soundcloud url.");
            }
            $( "#input" ).val("");
        }
    }).then(function(response){
        console.log(response, queue)
        if(response.kind == "playlist"){
            for(var i=0; i<response.tracks.length; i++){
                var track = response.tracks[i];
                track.trackId = trackId;
                track.trackDuration = millisToMinutesAndSeconds(track.duration);
                if(track.title.length > 32){
                    track.title = track.title.substring(0, 32) + "...";
                }
                $( "#queue" ).append(trackTemplate(track));
                queue.push(track);
                $( "#input" ).val("");
                trackId++;
            }
        }
        else{
            response.trackId = trackId;
            response.trackDuration = millisToMinutesAndSeconds(response.duration);
            if(response.title.length > 32){
                response.title = response.title.substring(0, 32) + "...";
            }
            $( "#queue" ).append(trackTemplate(response));
            queue.push(response);
            $( "#input" ).val("");
            trackId++;
        }

    })
}
/* =====================
 * DRAG-N-DROP RESORTING
 * =====================
 */
// Debug
function printQueue(){
    console.log("Current track: ", currentTrack);
    for(var i in queue){
        console.log(queue[i].title, currentTrack);

    }
}

// Make the queue sortable
$(document).ready(function(){
    $( "#queue" ).sortable();
})

// When the visual queue (i.e. the list) gets reordered, update the actual queue
$("#queue").on("sortstop", function(event, ui){
    reorderQueue();
});

// The list tells us the desired order of play: use the track titles as a comparator
// in order to update the actual queue.
// O(n^2), but the queues are generally small so it's not a cardinal sin
function reorderQueue(){
    var tmpQueue = [];

    $('ul > li').each(function(){
        for(var i in queue){
            if($(this).find('h1').text() === queue[i].title){
                tmpQueue.push(queue[i]);
                // Fix the currentTrack pointer
                if($(this).attr('class') != "track inactive"){
                    currentTrack = tmpQueue.length-1;
                }
            }
        }
    });

    queue = tmpQueue;
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
    $("#" + queue[currentTrack].trackId).addClass("inactive");
    if(currentSound){
        currentSound.pause();
        currentSound.seek(0);
    }
    document.getElementById("time").innerHTML = " ";
    $( "#playpause" ).css({backgroundImage: "url(icons/play.png)"});
    firstPlay = true;
    if(currentSound ==  queue.length - 1){
        currentTrack = 0;
        $("#" + queue[currentTrack].trackId).removeClass("inactive");
    }
    else{
        currentTrack++;
    }
    if(cont){
        play();
    }
}

function prev(cont) {
    $("#" + queue[currentTrack].trackId).addClass("inactive");
    document.getElementById("time").innerHTML = " ";
    if(currentSound){
        currentSound.pause();
        currentSound.seek(0);
    }
    $( "#playpause" ).css({backgroundImage: "url(icons/play.png)"});
    firstPlay = true;
    currentTrack--;
    if(cont){
        play();
    }
}

function play() {
    if(currentTrack < queue.length && currentTrack >= 0 && queue.length != 0){
        $("#" + queue[currentTrack].trackId).removeClass("inactive");
        $( "#playpause" ).css({backgroundImage: "url(icons/pause.png)"});
        var trackUrl = "/tracks/" + queue[currentTrack].id;
        console.log(trackUrl, currentTrack);
        SC.stream(trackUrl).then(function(player){
            $(window).keydown(function (e) {
                if (e.keyCode == 17) {
                    console.log(player);
                }
            });
            playState = true;
            currentSound = player;
            playState = true;
            player.play();
            player.on("finish", function(){
                next(true);
            });
            // Append waveform image and switch display type via class toggle
            waveform = queue[currentTrack].waveform_url;
            $('#waveformScrub').append('<img src="' + waveform + '">');
            $('#waveformScrub').toggleClass('waveOff');
            $('#waveformScrubElapsed').toggleClass('notPlaying');

            player.on("time", function(){
                if(currentTrack < queue.length && currentTrack >= 0){
                    var elapsed = millisToMinutesAndSeconds(currentSound.currentTime());
                    var duration = millisToMinutesAndSeconds(queue[currentTrack].duration);
                    var percentDone = ((currentSound.currentTime()/queue[currentTrack].duration)*100);
                    var waveformWidth = percentDone*0.49;
                    $('#time').html(elapsed + " / " + duration);
                    $('#waveformScrubElapsed').css('width', waveformWidth+'%');
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
        $( "#playpause" ).css({backgroundImage: "url(icons/play.png)"});
        currentSound.pause();
        playState = false;
    }

}

function clear(track) {
    var toClear = parseInt(track.substring(5));
    for(var i=0; i<queue.length; i++){
        if(queue[i].trackId == toClear){
                queue.splice(i,1);
                if(i == currentTrack){
                    document.getElementById("time").innerHTML = " ";
                    next(false);
                }
                else if(i < currentTrack){
                    currentTrack--;
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
