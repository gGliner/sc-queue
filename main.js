var trackTemplateString = $('#track-template').html();
var trackTemplate = Handlebars.compile(trackTemplateString);
var npTemplateString = $('#now-playing').html();
var npTemplate = Handlebars.compile(npTemplateString);
var updateTimeout;

var cid = '3255288e8a5aee620ee0a40f179cb73d';

SC.initialize({
  client_id: cid
});

$(window).on('dragstart', 'img', function(e) {
    e.preventDefault();
}); // Keep users from dragging images

window.onkeydown = function(e) {
    return !(e.keyCode == 32);
};

function lightenBackground(){
    $( "#input" ).css({backgroundColor: "rgba(255,255,255,.27)"});
}

function darkenBackground(){
    $( "#input" ).css({backgroundColor: "rgba(255,255,255,.15)"});
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

$(document).on('click','.newtab',function() {
});

$(document).on('click', '.track',function(e) {
    if(!$(e.target).is('.clear') && !$(e.target).is('.newtab')){
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
        url: "https://api.soundcloud.com/resolve?url=" +
            document.getElementById("input").value +
            "&client_id=" + cid,
        error: function(jqXHR, textStatus, errorThrown) {
                alert("Please enter a valid SoundCloud URL. If you entered a valid SoundCloud URL and you're still getting this message, it's because SoundCloud blocks our access to certain tracks with no explanation.");
            $( "#input" ).val("");
        }
    }).then(function(response){
        console.log(response, queue);
        $( "#placeholder" ).remove();
        $( "#dragtext" ).removeClass("hidden");
        if(response.kind == "playlist"){
            for(var i=0; i<response.tracks.length; i++){
                var track = response.tracks[i];
                var trackExists = false;
                for(check in queue){
                    if(queue[check].id == track.id){
                        trackExists = true;
                        break;
                    }
                }
                if(!trackExists){
                    track.trackId = trackId;
                    track.trackDuration = millisToMinutesAndSeconds(track.duration);
                    if(track.title.length > 50){
                        track.title = track.title.substring(0, 50) + "...";
                    }
                    console.log(track);
                    $( "#queue" ).append(trackTemplate(track));
                    queue.push(track);
                    trackId++;
                }
                $( "#input" ).val("");
            }
        }
        else{
            for(check in queue){
                if(queue[check].id == response.id){
                    alert("That track is already in your queue.");
                    $( "#input" ).val("");
                    return;
                }
            }
            response.trackId = trackId;
            response.trackDuration = millisToMinutesAndSeconds(response.duration);
            if(response.title.length > 50){
                response.title = response.title.substring(0, 50) + "...";
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
                //next(true);
            });
            // Append waveform image and switch CSS display
            waveform = queue[currentTrack].waveform_url;
            $('.waveformImg').attr('src', waveform);
            $('#waveformScrub').removeClass('waveOff')
            $('#waveformScrubElapsed').removeClass('notPlaying');

            $( "#nowplaying" ).html("");
            $( "#nowplaying" ).append(npTemplate(queue[currentTrack]));

            // Get elapsed time and set waveform progress
            player.on("time", function(){
                if(currentTrack < queue.length && currentTrack >= 0){
                    if(currentSound.currentTime()==queue[currentTrack].duration){
                        next(true);
                    }
                    var elapsed = millisToMinutesAndSeconds(currentSound.currentTime());
                    var duration = millisToMinutesAndSeconds(queue[currentTrack].duration);
                    var percentDone = ((currentSound.currentTime()/queue[currentTrack].duration)*100);
                    var waveformWidth = percentDone*0.49;
                    $('#time').html(elapsed + " / " + duration);
                    $('#waveformScrubElapsed').css('width', waveformWidth+'%');
                }
            });

            // Scrubbalubbadubdub
            var scrub = function() {
                var waveformOffset = $('.waveformImg').offset().left/$(document).width();
                var cursorAtX = event.pageX/$(document).width();
                var scrubPoint = (cursorAtX-waveformOffset)*2;
                if(scrubPoint < .25){
                    scrubPoint = scrubPoint*(1 + scrubPoint/12);
                }
                else if(scrubPoint < .5){
                    scrubPoint = scrubPoint*(1 + scrubPoint/24);
                }
                else if(scrubPoint < .75){
                    scrubPoint = scrubPoint*(1 + scrubPoint/36);
                }
                else {
                    scrubPoint = scrubPoint*(1 + scrubPoint/48);
                }
                var scrubPosition = queue[currentTrack].duration*scrubPoint;
                return scrubPosition // in % of song played
            };
                // Click event
            $(document).on('click', '.waveformImg', function(){
                player.seek(scrub());
            });
                // Drag event

            $( "#waveformScrub" ).slider({
                start: function( event, ui ) {
                    playPause();
                },
                slide: function( event, ui ) {
                    var scrubDrag = scrub();
                    scrubDrag = (scrubDrag/queue[currentTrack].duration)*49;
                    $('#waveformScrubElapsed').css('width', scrubDrag+'%');
                    player.seek(scrub());
                },
                stop: function( event, ui ) {
                    playPause();
                    console.log('land')
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
function millisToSeconds(millis) {
    var seconds = (millis / 1000).toFixed(0);
    return seconds;
}
