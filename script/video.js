var video = document.getElementById("video");

var canvas = document.getElementById("canvas-video");
var context = canvas.getContext("2d");

var overlay = document.getElementById("video-overlay");
var overlayContext = overlay.getContext("2d");

var librarySelector = document.getElementById("select_library");
var delay = document.getElementById("delay");

var ctrack;

video.addEventListener("ended", function () {
    clearInterval(vidInterval);
    window.time_dump.innerHTML = "finished";
});

function start() {
    video.play();
    var detector;

    switch (librarySelector.value) {
        case "ccv":
            detector = ccvDetect;
            break;

        case "jsobjectdetect":
            detector = jsObjectDetect;
            break;

        case "clmtrackr":
            ctrack = new clm.tracker({ useWebGL: true });
            ctrack.init(pModel);
            ctrack.start(video);

            clmtrackrDetect();
            break;

        default:
    }

    window.vidInterval = setInterval(detector, delay.value);
}

function drawRectToCanvas(x, y, width, height, color) {
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.rect(x, y, width, height);
    context.stroke();
}

function drawRectToOverlay(x, y, width, height, color) {
    overlayContext.beginPath();
    overlayContext.lineWidth = 2;
    overlayContext.strokeStyle = color;
    overlayContext.rect(x, y, width, height);
    overlayContext.stroke();
}

function ccvDetect() {
    context.drawImage(video, 0, 0, video.width, video.height, 0, 0, canvas.width, canvas.height);

    var faces = ccv.detect_objects({
        "canvas": (ccv.pre(canvas)),
        "cascade": cascade,
        "interval": 3,
        "min_neighbors": 1
    });

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        drawRectToCanvas(face.x, face.y, face.width, face.height, 'rgba(255, 0, 0, 0.75)');
    }
}

function jsObjectDetect() {
    context.drawImage(video, 0, 0, video.width, video.height, 0, 0, canvas.width, canvas.height);

    var classifier = objectdetect.frontalface;
    var detector = new objectdetect.detector(canvas.width, canvas.height, 2, classifier);

    var rects = detector.detect(canvas);

    for (var i = 0; i < rects.length; ++i) {
        var rect = rects[i];
        drawRectToCanvas(rect[0], rect[1], rect[2], rect[3], 'rgba(0, 255, 255, 0.75)');
    }
}

function clmtrackrDetect() {
    drawLoop();

    var drawRequest;
    function drawLoop() {
        drawRequest = requestAnimationFrame(drawLoop);
        context.clearRect(0, 0, canvas.width, canvas.height);
        overlayContext.clearRect(0, 0, overlay.width, overlay.height);
        if (ctrack.getCurrentPosition()) {
            ctrack.draw(canvas);
            ctrack.draw(overlay);
        }
    }
}