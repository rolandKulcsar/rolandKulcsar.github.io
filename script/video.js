var video = document.getElementById("video");

var canvas = document.getElementById("canvas-video");
var context = canvas.getContext("2d");

var overlay = document.getElementById("video-overlay");
var overlayContext = overlay.getContext("2d");

var librarySelector = document.getElementById("select_library");
var delay = document.getElementById("delay");

var currentFpsCounter = document.getElementById("currentFpsCounter");
var minFpsCounter = document.getElementById("minFpsCounter");
var maxFpsCounter = document.getElementById("maxFpsCounter");
var avgFpsCounter = document.getElementById("avgFpsCounter");
var avgFps = 0;
var frames = 0;

var fps, lastCalledTime;

var ctrack;

video.addEventListener("ended", function () {
    clearInterval(vidInterval);
    window.time_dump.innerHTML = "finished";
});

function start() {
    video.play();
    var detector;

    minFpsCounter.innerHTML = Number.MAX_VALUE;
    maxFpsCounter.innerHTML = 0;

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

    // window.vidInterval = setInterval(detector, delay.value);
    setInterval(detector, delay.value);
}

function drawRectToCanvas(x, y, width, height, color) {
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.rect(x, y, width, height);
    context.stroke();
}

function showFps() {
    frames++;

    if (!lastCalledTime) {
        lastCalledTime = Date.now();
        fps = 0;

        return;
    }

    var delta = (Date.now() - lastCalledTime) / 1000;
    lastCalledTime = Date.now();
    fps = 1 / delta;

    currentFpsCounter.innerHTML = fps.toFixed(0);
    minFpsCounter.innerHTML = Math.min(fps, parseInt(minFpsCounter.innerHTML)).toFixed(0);
    maxFpsCounter.innerHTML = Math.max(fps, parseInt(maxFpsCounter.innerHTML)).toFixed(0);

    avgFps += fps;
    avgFpsCounter.innerHTML = (avgFps / frames).toFixed(0);
}

function ccvDetect() {
    showFps();

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
    showFps();

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
        showFps();

        drawRequest = requestAnimationFrame(drawLoop);
        context.clearRect(0, 0, canvas.width, canvas.height);
        overlayContext.clearRect(0, 0, overlay.width, overlay.height);
        if (ctrack.getCurrentPosition()) {
            ctrack.draw(canvas);
            ctrack.draw(overlay);
        }
    }
}