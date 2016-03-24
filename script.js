var canvas = document.getElementById("canvas_voronoi");
var context = canvas.getContext("2d");
var metricSelector = document.getElementById("select_distance");

var controlPoints = new Array();

var epsilon = 0.01;
var controlPointRadius = 10;
var size = canvas.width;

canvas.addEventListener("mousedown", function (evt) {
    metricSelector.disabled = true;

    controlPoints.push({ x: evt.offsetX, y: evt.offsetY });
    drawDiagramToCanvas();
}, false);

function onClear() {
    controlPoints = new Array();
    context.clearRect(0, 0, canvas.width, canvas.height);
    metricSelector.disabled = false;
}

function getPNormDistance(norm, x1, x2, y1, y2) {
    return Math.pow(Math.abs(x1 - x2), norm) + Math.pow(Math.abs(y1 - y2), norm);
}

function getNormValue() {
    switch (metricSelector.value) {
        case "euclidean":
            return 2;
        case "manhattan":
            return 1;
        case "3norm":
            return 3;

        default:
            return 2;
    }
}

function getClosestControlPointAndDistance(x, y) {
    var closest = null;
    var distance = Number.MAX_VALUE;

    for (var i = 0; i < controlPoints.length; i++) {
        var controlPoint = controlPoints[i];

        var normValue = getNormValue();
        var currentDistance = getPNormDistance(normValue, controlPoint.x, x, controlPoint.y, y);
        if (Math.abs(currentDistance) < epsilon) {
            return { controlPoint: controlPoint, distance: 0 };
        }

        if (currentDistance < distance) {
            closest = controlPoint;
            distance = currentDistance;
        }
    }

    return { controlPoint: closest, distance: distance };
}

function drawDiagramToCanvas() {
    for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
            var pointDistancePair = getClosestControlPointAndDistance(x, y);
            var r = 0;
            var g = 0;
            var b = 0;

            if (controlPointRadius < pointDistancePair.distance) {
                r = (pointDistancePair.controlPoint.x * 255 / size) | 0;
                b = (pointDistancePair.controlPoint.y * 255 / size) | 0;
                g = (255 - ((r + b) / 2)) | 0;
            }

            context.fillStyle = "rgba(" + r + "," + g + "," + b + ",1)";
            context.fillRect(x, y, 1, 1);
        }
    }
}