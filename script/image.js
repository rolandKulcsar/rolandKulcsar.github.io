var canvas = document.getElementById("canvas_image");
var context = canvas.getContext("2d");

var overlay = document.getElementById("canvas_overlay");
var overlayContext = overlay.getContext("2d");

var tip = document.getElementById("canvas-tip");
var tipContext = tip.getContext("2d");

var librarySelector = document.getElementById("select_library");
var trackingTimeLabel = document.getElementById("label_detectionTime");
var ctrack;
var fileList, fileIndex;
var boundingBoxes = new Array();
var canvasWidth = 1280;
var canvasHeight = 720;

// set up
if (window.File && window.FileReader && window.FileList) {
    function handleFileSelect(evt) {
        var files = evt.target.files;
        fileList = [];
        for (var i = 0; i < files.length; i++) {
            if (!files[i].type.match("image.*")) {
                continue;
            }
            fileList.push(files[i]);
        }
        if (files.length > 0) {
            fileIndex = 0;
        }

        loadImage();
    }

    document.getElementById("files").addEventListener("change", handleFileSelect, false);
}

// event listeners
tip.addEventListener("mousemove", function (evt) {
    var x = evt.offsetX;
    var y = evt.offsetY;

    for (var i = 0; i < boundingBoxes.length; i++) {
        var rect = boundingBoxes[i];
        if (rect.x < x && x < (rect.x + rect.width) &&
            rect.y < y && y < (rect.y + rect.height)) {
            tipContext.font = "15px Verdana";
            tipContext.fillStyle = "rgba(57,255,20,1)";
            tipContext.fillText("Confidence: " + rect.conf.toFixed(2), rect.x + rect.width + 4, rect.y + rect.height + 4);

            break;
        } else {
            tipContext.clearRect(0, 0, tip.width, tip.height);
        }
    }
});

function onDetectClick() {
    switch (librarySelector.value) {
        case "ccv":
            ccvDetect(canvas);
            break;

        case "jsobjectdetect":
            jsObjectDetect();
            break;

        case "clmtrackr":
            clmtrackrDetect();
            break;

        default:
    }
};

// functions
function loadImage() {
    if (fileList.indexOf(fileIndex) < 0) {
        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {

                var img = new Image();
                img.onload = function () {
                    if (img.height > canvasHeight || img.width > canvasWidth) {
                        var rel = img.height / img.width;
                        var neww = canvasWidth;
                        var newh = neww * rel;
                        if (newh > canvasHeight) {
                            newh = canvasHeight;
                            neww = newh / rel;
                        }
                        canvas.setAttribute("width", neww);
                        canvas.setAttribute("height", newh);
                        context.drawImage(img, 0, 0, neww, newh);
                    } else {
                        canvas.setAttribute("width", img.width);
                        canvas.setAttribute("height", img.height);
                        context.drawImage(img, 0, 0, img.width, img.height);
                    }
                }

                img.src = e.target.result;
            };
        })(fileList[fileIndex]);
        reader.readAsDataURL(fileList[fileIndex]);

        cleanUp();
    }
}

function cleanUp() {
    boundingBoxes = [];
    trackingTimeLabel.innerHTML = "";

    overlayContext.clearRect(0, 0, overlay.width, overlay.height);
    tipContext.clearRect(0, 0, tip.width, tip.height);

    ctrack.reset();
}

function drawRectToCanvas(x, y, width, height, color) {
    overlayContext.beginPath();
    overlayContext.lineWidth = 2;
    overlayContext.strokeStyle = color;
    overlayContext.rect(x, y, width, height);
    overlayContext.stroke();
}

function printTrackingTime(time) {
    trackingTimeLabel.innerHTML = "Detection time: " + time.toFixed(2) + " ms";
}

function ccvDetect() {
    var start = performance.now();
    var faces = ccv.detect_objects({
        "canvas": (ccv.pre(canvas)),
        "cascade": cascade,
        "interval": 3,
        "min_neighbors": 1
    });

    var end = performance.now();

    printTrackingTime(end - start);

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        drawRectToCanvas(face.x, face.y, face.width, face.height, 'rgba(255, 0, 0, 0.75)');
        boundingBoxes.push({ x: Math.round(face.x), y: Math.round(face.y), width: Math.round(face.width), height: Math.round(face.height), conf: face.confidence });
    }
}

function jsObjectDetect() {
    var classifier = objectdetect.frontalface;
    var detector = new objectdetect.detector(canvas.width, canvas.height, 2, classifier);

    var start = performance.now();
    var rects = detector.detect(canvas);
    var end = performance.now();

    printTrackingTime(end - start);

    for (var i = 0; i < rects.length; ++i) {
        var rect = rects[i];
        drawRectToCanvas(rect[0], rect[1], rect[2], rect[3], 'rgba(0, 255, 255, 0.75)');
        boundingBoxes.push({ x: Math.round(rect[0]), y: Math.round(rect[1]), width: Math.round(rect[2]), height: Math.round(rect[3]), conf: rect[4] });
    }
}

function clmtrackrDetect() {
    ctrack = new clm.tracker({ stopOnConvergence: true });
    ctrack.init(pModel);

    var start = performance.now();
    ctrack.start(canvas);
    var end = performance.now();

    printTrackingTime(end - start);

    document.addEventListener("clmtrackrNotFound", function (event) {
        ctrack.stop();
        alert("Clmtrackr fails to find a face!");
    }, false);

    document.addEventListener("clmtrackrLost", function (event) {
        ctrack.stop();
        alert("Clmtrackr loses tracking of face!");
    }, false);

    drawLoop();

    var drawRequest;
    function drawLoop() {
        drawRequest = requestAnimationFrame(drawLoop);
        overlayContext.clearRect(0, 0, overlay.width, overlay.height);

        if (ctrack.getCurrentPosition()) {
            ctrack.draw(overlay);
        }
    }
}