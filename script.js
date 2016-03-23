var canvas = document.getElementById("canvas_voronoi");
var context = canvas.getContext("2d");

var controlPoints = new Array();

var epsilon = 0.01;
var controlPointRadius = 15;
var size = canvas.width;

canvas.addEventListener("mousedown", function (evt) {
    controlPoints.push({ x: evt.offsetX, y: evt.offsetY });
    drawVoronoiToCanvas();
}, false);

function getClosestControlPointAndDistance(x, y) {
    var closest = null;
    var distance = Number.MAX_VALUE;

    for (var i = 0; i < controlPoints.length; i++) {
        var controlPoint = controlPoints[i];

        var currentDistance = Math.pow(controlPoint.x - x, 2) + Math.pow(controlPoint.y - y, 2);
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

function drawVoronoiToCanvas() {
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