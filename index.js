var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWith = 2;

// Set up mouse events for drawing
var drawing = false;
var validate = false;
var validateDirections = false;
var mousePos = {
    x: 0,
    y: 0
};
var lastPos = mousePos;
canvas.addEventListener("mousedown", function (e) {
    drawing = true;
    lastPos = getMousePos(canvas, e);
}, false);
canvas.addEventListener("mouseup", function (e) {
    drawing = false;
}, false);
canvas.addEventListener("mousemove", function (e) {
    mousePos = getMousePos(canvas, e);
}, false);

// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}

// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimaitonFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

function getDirection(lastPos, mousePos) {
    var direction = 'C';
    
    if (!lastPos) {
        lastPos = window.lastPos;
    }

    if (!mousePos) {
        mousePos = window.mousePos;
    }

    var deltaX = mousePos.x - lastPos.x;
    var deltaY = mousePos.y - lastPos.y;

    var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    if (-22.5 < angle && angle < 22.5) {
        direction = 'E';
    }
    else if (22.5 < angle && angle < 67.5) {
        direction = 'SE';
    }
    else if (67.5 < angle && angle < 112.5) {
        direction = 'S';
    }
    else if (112.5 < angle && angle < 157.5) {
        direction = 'SW';
    }
    else if (157.5 < angle && angle < 180 || angle > -180 && angle < -157.5) {
        direction = 'W';
    }
    else if (-157.5 < angle && angle < -112.5) {
        direction = 'NW';
    }
    else if (-112.5 < angle && angle < -67.5) {
        direction = 'N';
    }
    else if (-67.5 < angle && angle < -22.5) {
        direction = 'NE';
    }
    else {
        direction = 'C';
    }

    return direction;
}

function levenshtein(str1, str2) {
    var n = str2.length;
    var v0 = new Array(n + 1).fill(0);
    var v1 = new Array(n + 1).fill(0);

    for (var i = 0; i < v0.length; i++) {
        v0[i] = i;
    }

    for (var i = 0; i < str1.length; i++) {
        v1[0] = i + 1;

        for (var j = 0; j < str2.length; j++) {
            var cost = 1;

            if (str1[i] == str2[j]) {
                cost = 0;
            }

            v1[j + 1] = Math.min(
                v1[j] + 1, //Insertion
                v0[j + 1] + 1, //Remove
                v0[j] + cost //Substitution
            );
        }

        var temp = v0;
        v0 = v1;
        v1 = temp;
    }

    return v0[n];
}

var signatures = [];
var directionsMap = [];
var idx = 0;

// Draw to the canvas
var lastSec = Date.now();
var lastSecPos = lastPos;
var lastDirection = 'C';

function getDistance(a, b, precision) {
    if (!precision) {
        precision = 0;
    }

    return Math.floor(Math.sqrt(Math.pow(mousePos.x - lastPos.x, 2) + Math.pow(mousePos.y - lastPos.y, 2)) * Math.pow(10, precision)) / Math.pow(10, precision);
}

function getDistances(a, b) {
    return [(a.x - b.x), (a.y - b.y)];
}

function renderCanvas() {
    var precision = 0;
    var distance = getDistance(lastPos, mousePos);

    
    if (!signatures[idx]) {
        signatures[idx] = [];
    }
    if (!directionsMap[idx]) {
        directionsMap[idx] = [];
    }

    if (drawing) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();

        if (Date.now() - lastSec >= 50) {
            var direction = getDirection(lastSecPos, mousePos);
            
            if (validateDirections.constructor === Array) {
                validateDirections.push(direction);
            }
            else {
                directionsMap[idx].push(direction);
            }
            
            lastSecPos = mousePos;
            lastSec = Date.now();
        }
        
        var distances = getDistances(lastPos, mousePos);
        if (lastPos.x !== mousePos.x || lastPos.y !== mousePos.y) {
            if (validate.constructor === Array) {
                validate.push(getDistances(lastPos, mousePos));
            }
            else {
                signatures[idx].push(getDistances(lastPos, mousePos));
            }
        }

        lastPos = mousePos;
    }
    else {
        var len = 0;
        if (validate.constructor === Array) {
            len = validate.length;
            validate[len - 1] = getDistances(lastPos, mousePos);
        }
        else {
            len = signatures[idx].length;
            signatures[idx][len - 1] = getDistances(lastPos, mousePos);
        }
    }
}

function minWithUndefined() {
    for (var i = 0; i < arguments.length; ++i) {
        if (arguments[i] === undefined) {
            arguments[i] = Infinity;
        }
    }

    return Math.min.apply(this, arguments);
}

function maxWithUndefined() {
    for (var i = 0; i < arguments.length; ++i) {
        if (arguments[i] === undefined) {
            arguments[i] = -Infinity;
        }
    }

    return Math.max.apply(this, arguments);
}

function getMinMaxPath(signatures) {
    var signature = [];

    if (!signatures) {
        signatures = window.signatures;
    }

    var maxLength = 0;
    signatures.forEach(one => maxLength = maxLength < one.length ? one.length : maxLength);

    for (var i = 0; i < maxLength; ++i) {
        var xs = [], ys = [];
        signatures.forEach(one => {
            if (one[i]) {
                xs.push(one[i][0]);
                ys.push(one[i][1]);
            }
        });

        signature[i] = [
            minWithUndefined.apply(this, xs),
            maxWithUndefined.apply(this, xs),
            minWithUndefined.apply(this, ys),
            maxWithUndefined.apply(this, ys)
        ];
    }

    return signature;
}

function lcs(intervals, signature) {
    var n1 = intervals.length;
    var n2 = signature.length;

    var LCS = new Array(n1+1);
    for (var i = 0; i < n1+1; i++) {
        LCS[i] = new Array(n2+1).fill(0);
    }

    for (var i = 0; i <= n1; i++) {
        for (var j = 0; j <= n2; j++) {
            if (!i || !j) {
                LCS[i][j] = 0;
            }
            else if (intervals[i - 1][0] < signature[j - 1][0]
                && signature [j - 1][0] < intervals[i - 1][1]
                && intervals[i - 1][2] < signature[j - 1][1]
                && signature[j - 1][1] < intervals[i - 1][3]) {
                LCS[i][j] = LCS[i - 1][j - 1] + 1;
            }
            else {
                LCS[i][j] = Math.max(LCS[i - 1][j], LCS[i][j - 1]);
            }
        }
    }

    return LCS[n1][n2];
}

function lcs_string(str1, str2) {
    var n1 = str1.length;
    var n2 = str2.length;

    var LCS = new Array(n1+1);
    for (var i = 0; i < n1+1; i++) {
        LCS[i] = new Array(n2+1).fill(0);
    }

    for (var i = 0; i <= n1; i++) {
        for (var j = 0; j <= n2; j++) {
            if (!i || !j) {
                LCS[i][j] = 0;
            }
            else if (str1[i - 1] == str2[j - 1]) {
                LCS[i][j] = LCS[i - 1][j - 1] + 1;
            }
            else {
                LCS[i][j] = Math.max(LCS[i - 1][j], LCS[i][j - 1]);
            }
        }
    }

    return LCS[n1][n2];
}



function checkValidate() {
    if (validate.constructor === Array) {
        var signatureIntervals = getMinMaxPath();
        var signature = validate;

        var LCS = lcs(signatureIntervals, signature);
        var min = Math.min(LCS, signature.length);
        
        var directions = validateDirections.join('');
        var minMatch = Infinity;
        directionsMap.forEach(one => {
            var str = one.join('');
            var len = str.length;
            var LCS = lcs_string(directions, str);

            var percent = LCS / Math.min(len, directions.length);
            minMatch = minMatch > percent ? percent : minMatch;
        });

        console.log({
            lcs: LCS,
            lcs_interval: LCS / Math.max(signatureIntervals.length, signature.length),
            lcs_signature: LCS / signature.length,
            min_direction: minMatch
        });
    }
    
    validate = [];
    validateDirections = [];
    canvas.width = canvas.width;
}

function findUser() {
    if (validate.constructor === Array) {
        var found = false;
        for (var user_id in db.signatures) {
            var interval = getMinMaxPath(db.signatures[user_id]);
            var LCS = lcs(interval, validate);
            var min = Math.min(LCS, validate.length);

            var l1 = LCS / Math.max(interval.length, validate.length);
            var l2 = LCS / validate.length;
            
            var directions = validateDirections.join('');
            var l3 = Infinity;
            db.directionsMap[user_id].forEach(one => {
                var str = one.join('');
                var len = str.length;
                var LCS = lcs_string(directions, str);
                
                var percent = LCS / Math.min(len, directions.length);
                l3 = l3 > percent ? percent : l3;
            });
            
            console.log(l1, l2, l3);
            if ((l1 + l2 + l3) / 3 >= 0.75) {
                var data = db.data[user_id];

                alert(JSON.stringify(data));
                found = true;
                break;
            }
        }

        if (!found) {
            alert('Not found');
        }
    }
}

function composeSignature(str) {

}

// Allow for animation
(function drawLoop() {
    requestAnimFrame(drawLoop);
    renderCanvas();
})();

// Set up touch events for mobile, etc
canvas.addEventListener("touchstart", function (e) {
    mousePos = getTouchPos(canvas, e);
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

function clearCanvas() {
    canvas.width = canvas.width;
    if (validate.constructor === Array) {
        validate = [];
        validateDirections = [];
    }
    else {
        signatures[idx] = [];
        directionsMap[idx] = [];
    }
}

function newCanvas() {
    canvas.width = canvas.width;
    idx++;
    signatures[idx] = [];
    directionsMap[idx] = [];
    validate = false;
    validateDirections = false;
}

function setCanvasDimensions() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
}

function goFullscreen() {
    var el = document.documentElement,
        rfs = el.requestFullScreen
        || el.webkitRequestFullScreen
        || el.mozRequestFullScreen
        || el.msRequestFullscreen;

    rfs.call(el);
}

$(function() {
    setCanvasDimensions();
    $(window).on('resize', setCanvasDimensions);

    var canvas = $('#canvas');
    canvas.on('touchstart', (e) => e.preventDefault());
    canvas.on('touchend', (e) => e.preventDefault());
    canvas.on('touchmove', (e) => e.preventDefault());

    $('#clear').click(clearCanvas);
    $('#fullscreen').click(goFullscreen);
    $('#add').click(newCanvas);
    $('#validate').click(checkValidate);
    $('#search').click(findUser);

    goFullscreen();
});