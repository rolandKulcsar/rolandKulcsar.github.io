var canvas = document.getElementById("canvas_image");
var ctx = canvas.getContext("2d");

var overlay = document.getElementById("canvas_overlay");
var overlayCC = overlay.getContext("2d");

var librarySelector = document.getElementById("select_library");
var elapsedTimeLabel = document.getElementById("label_elapsed_time");
var ctrack;
var fileList, fileIndex;

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
function onStartClick() {
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
                    if (img.height > 720 || img.width > 1280) {
                        var rel = img.height / img.width;
                        var neww = 1280;
                        var newh = neww * rel;
                        if (newh > 720) {
                            newh = 720;
                            neww = newh / rel;
                        }
                        canvas.setAttribute("width", neww);
                        canvas.setAttribute("height", newh);
                        ctx.drawImage(img, 0, 0, neww, newh);
                    } else {
                        canvas.setAttribute("width", img.width);
                        canvas.setAttribute("height", img.height);
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                    }
                }

                img.src = e.target.result;
            };
        })(fileList[fileIndex]);
        reader.readAsDataURL(fileList[fileIndex]);
        overlayCC.clearRect(0, 0, overlay.width, overlay.height);
        ctrack.reset();
    }
}

function drawRectToCanvas(x, y, width, height, color) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.rect(x, y, width, height);
    ctx.stroke();
}

function ccvDetect(canvas) {
    var start = performance.now();
    var faces = ccv.detect_objects({
        "canvas": (ccv.pre(canvas)),
        "cascade": cascade,
        "interval": 3,
        "min_neighbors": 1
    });

    var end = performance.now();

    elapsedTimeLabel.innerHTML = "Elapsed time: " + (end - start) + " ms";

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        drawRectToCanvas(face.x, face.y, face.width, face.height, 'rgba(255, 0, 0, 0.75)');
    }

    return faces, (end - start);
}

function jsObjectDetect() {
    var classifier = objectdetect["frontalface"];
    var detector = new objectdetect.detector(canvas.width, canvas.height, 2, classifier);

    var start = performance.now();
    var faces = detector.detect(canvas);
    var end = performance.now();

    elapsedTimeLabel.innerHTML = "Elapsed time: " + (end - start) + " ms";

    for (var i = 0; i < faces.length; ++i) {
        var face = faces[i];
        drawRectToCanvas(face[0], face[1], face[2], face[3], 'rgba(0, 255, 255, 0.75)');
    }
}

function clmtrackrDetect() {
    ctrack = new clm.tracker({ stopOnConvergence: true });
    ctrack.init(pModel);
    ctrack.start(canvas);

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
        overlayCC.clearRect(0, 0, overlay.width, overlay.height);
        if (ctrack.getCurrentPosition()) {
            ctrack.draw(overlay);
        }
    }
}

// TODO confidence
// TODO parameters
// TODO error listeners