var loopInterval = null;
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var player1 = null;
var player2 = null;
var ball = null;

var player1Buttons = [false, false];
var player2Buttons = [false, false];

var starttext = null;
var starttextColor = null;

var paused = false;
var pausecooldown = 0;

var touchcontrols = false;

var humans = 1;

var pointsForWin = 6;

var score = [0, 0];


/**
 * 
 * @param {string} color 
 * @param {number} left 
 * @param {number} top 
 * @param {number} width 
 * @param {number} height 
 */
async function drawRectangle(color, left, top, width, height) {
    var canvas = document.getElementById("gamecanvas");
    var context = canvas.getContext("2d");
    context.fillStyle = color;
    context.fillRect(left, top, width, height);
}

/**
 * 
 * @param {string} color 
 * @param {number} left 
 * @param {number} top 
 * @param {number} radius 
 */
async function drawCircle(color, left, top, radius) {
    var canvas = document.getElementById("gamecanvas");
    var context = canvas.getContext("2d");
    context.fillStyle = color;
    context.beginPath();
    context.arc(left + radius, top + radius, radius, 0, Math.PI * 2, true);
    context.fill();
}

/**
 * 
 * @param {string} text
 * @param {number} size
 * @param {string} color 
 * @param {number} left 
 * @param {number} top 
 */
async function drawText(text, size, color, left, top) {
    // Draw the text
    // Top should represent the upper left corner of the text
    var canvas = document.getElementById("gamecanvas");
    var context = canvas.getContext("2d");
    context.fillStyle = color;
    context.font = size + "px Arial";
    context.fillText(text, left, top);
}

/**
 * 
 * @param {string} text 
 * @param {number} size 
 * @param {string} color 
 * @param {number} top 
 */
async function drawCenteredText(text, size, color, top) {
    // Draw the text centered
    // Top should represent the upper left corner of the text
    var canvas = document.getElementById("gamecanvas");
    var context = canvas.getContext("2d");
    context.fillStyle = color;
    context.font = size + "px Arial";
    context.fillText(text, canvas.width / 2 - context.measureText(text).width / 2, top);
}

function resetGame() {
    clearInterval(loopInterval);
    ball = new Ball(windowWidth / 2, windowHeight / 2, null, null, new Vector2(0, 0));
    if (score[0] >= pointsForWin || score[1] >= pointsForWin) {
        lose();
    } else {
        main();
    }
}

function lose() {
    clearInterval(loopInterval);
    document.getElementById("losescreen-score").innerHTML = `${score[0]} : ${score[1]}`;
    document.getElementById("losescreen").style.display = "block";
    score = [0, 0];
}


class Direction {
    static UP = 1;
    static DOWN = 2;
    static NONE = 0;
}

class Vector2 {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @param {Vector2} vector 
     * @returns {Vector2}
     */
    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }

    /**
     * @param {Vector2} vector
     * @returns {Vector2} 
     */
    subtract(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }

    /**
     * @param {number} number
     * @returns {Vector2}
     */
    multiply(number) {
        return new Vector2(this.x * number, this.y * number);
    }

    /**
     * @param {number} number
     * @returns {Vector2}
     */
    divide(number) {
        return new Vector2(this.x / number, this.y / number);
    }

    /**
     * @returns {number}
     */
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class Ball {
    static DEFAULTRADIUS = 8;
    static DEFAULTCOLOR = "white";
    static RAMP_PER_HIT = 0.3;

    static DEFAULTVECTOR() {
        return new Vector2(Math.random() < 0.5 ? -7 : 7, Math.random() * (10 - 5) + 5);
    }
    static RANDOMVARIANCE = 3;

    /**
     * @param {number} left distance from left side of the screen to ball center
     * @param {number} top distance from top side of the screen to ball center
     * @param {number} radius radius of the ball
     * @param {string} color color of the ball
     * @param {Vector2} vector vector the ball moves with (per frame)
     */
    constructor(left, top, radius, color, vector) {
        // Set the values, if null is given, use default values
        this.left = left || windowWidth / 2;
        this.top = top || windowHeight / 2;
        this.radius = radius || Ball.DEFAULTRADIUS;
        this.color = color || Ball.DEFAULTCOLOR;
        this.vector = vector || Ball.DEFAULTVECTOR();
    }

    async move() {
        if (this.left + this.radius >= player1.left && this.left + this.radius <= player1.left + player1.width && this.top + this.radius >= player1.top && this.top + this.radius <= player1.top + player1.height) {
            this.vector.x = Math.abs(this.vector.x) + Ball.RAMP_PER_HIT;
            this.vector.y += Math.floor(Math.random() * Ball.RANDOMVARIANCE) - Ball.RANDOMVARIANCE / 2;
        }
        if (this.left - this.radius <= player2.left + player2.width && this.left - this.radius >= player2.left && this.top + this.radius >= player2.top && this.top + this.radius <= player2.top + player2.height) {
            this.vector.x = -Math.abs(this.vector.x) - Ball.RAMP_PER_HIT;
            this.vector.y += Math.floor(Math.random() * Ball.RANDOMVARIANCE) - Ball.RANDOMVARIANCE / 2;
        }

        if (this.left + this.radius >= windowWidth) {
            score[0]++;
            resetGame();
        }

        if (this.left - this.radius <= 0) {
            score[1]++;
            resetGame();
        }

        if (this.top + this.radius >= windowHeight || this.top - this.radius <= 0) {
            this.vector.y = -this.vector.y;
        }

        this.left += this.vector.x;
        this.top += this.vector.y;
    }

    async draw() {
        await drawCircle(this.color, this.left, this.top, this.radius);
    }
}

async function AI(player) {
    if (player.top + player.height / 4 > ball.top) {
        player.direction = Direction.UP;
    } else if (player.top + player.height / 4 * 3 < ball.top) {
        player.direction = Direction.DOWN;
    } else {
        player.direction = Direction.NONE;
    }
}

class Player {
    /**
     * @param {number} left
     * @param {number} top
     * @param {string} color
     */

    static PLAYERWIDTH = 12;
    static PLAYERSPEED = 10;
    static DEFAULTCOLOR = "white";

    constructor(left, top, color) {
        this.width = Player.PLAYERWIDTH;
        this.height = touchcontrols ? windowHeight / 4 : windowHeight / 6;
        this.left = left || 10;
        this.top = top || windowHeight / 2 - this.height / 2;
        this.color = color || Player.DEFAULTCOLOR;
        this.direction = Direction.NONE;
    }

    async draw() {
        await drawRectangle(this.color, this.left, this.top, this.width, this.height);
    }

    async move() {
        if (this.direction == Direction.UP) {
            this.top -= Player.PLAYERSPEED;
            if (this.top < 0) {
                this.top = 0;
            }
        } else if (this.direction == Direction.DOWN) {
            this.top += Player.PLAYERSPEED;
            if (this.top + this.height > windowHeight) {
                this.top = windowHeight - this.height;
            }
        }
    }
}

async function clearCanvas() {
    var canvas = document.getElementById("gamecanvas");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function configureCanvas() {
    // set the canvas size to the size of the window
    var canvas = document.getElementById("gamecanvas");
    canvas.width = windowWidth;
    canvas.height = windowHeight;
}

function pausetoggle() {
    if (pausecooldown > 0) {
        return;
    }

    if (!paused) {
        paused = true;
        clearInterval(loopInterval);
        document.getElementById("pausescreen").style.display = "block";
        return false;
    } else {
        pausecooldown = 1000;
        paused = false;
        document.getElementById("pausescreen").style.display = "none";
        loopInterval = setInterval(gameloop, 1000 / 60);
        return true;
    }
}

async function gameloop() {
    clearCanvas();
    pausecooldown -= 1000 / 60;

    if (starttext != null) {
        await drawCenteredText(starttext, windowHeight / 8, starttextColor || "white", windowHeight / 2 - windowHeight / 16);
    }
    drawCenteredText(`${score[0]} : ${score[1]}`, windowHeight / 12, "white", windowHeight / 12 + 10);

    if (humans == 1) {
        await AI(player2);
    } else if (humans == 0) {
        await AI(player1);
        await AI(player2);
    }

    await player1.move();
    await player2.move();
    await ball.move();
    ball.draw();
    player1.draw();
    player2.draw();
}

async function main() {
    configureCanvas();
    player1 = new Player(30, windowHeight / 2 - windowHeight / 12, null);
    player2 = new Player(windowWidth - Player.PLAYERWIDTH - 30, windowHeight / 2 - windowHeight / 12, null);
    ball = new Ball(windowWidth / 2, windowHeight / 2, null, null, new Vector2(0, 0));
    loopInterval = setInterval(gameloop, 1000 / 60);

    starttext = "READY?";
    starttextColor = "red";

    setTimeout(async function () {
        starttext = "GO!";
        starttextColor = "lime";
        setTimeout(async function () {
            starttext = null;
            starttextColor = null;
        }, 800);
        ball.vector = Ball.DEFAULTVECTOR();
    }, 1000);
}

window.onresize = function () {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    configureCanvas();
}

document.documentElement.onkeydown = function (e) {
    if (e.key == "Escape") {
        pausetoggle();
    }

    if (humans > 0) {
        if (e.key == "w") {
            player1Buttons[0] = true;
        } else if (e.key == "s") {
            player1Buttons[1] = true;
        }

        if (player1Buttons[0] && player1Buttons[1]) {
            player1.direction = Direction.NONE;
        } else if (player1Buttons[0]) {
            player1.direction = Direction.UP;
        } else if (player1Buttons[1]) {
            player1.direction = Direction.DOWN;
        } else {
            player1.direction = Direction.NONE;
        }

        if (humans == 2) {
            if (e.key == "ArrowUp") {
                player2Buttons[0] = true;
            } else if (e.key == "ArrowDown") {
                player1Buttons[1] = true;
            }

            if (player2Buttons[0] && player2Buttons[1]) {
                player2.direction = Direction.NONE;
            } else if (player2Buttons[0]) {
                player2.direction = Direction.UP;
            } else if (player2Buttons[1]) {
                player2.direction = Direction.DOWN;
            } else {
                player2.direction = Direction.NONE;
            }
        }
    }
}

document.documentElement.onkeyup = function (e) {
    if (humans > 0) {
        if (e.key == "w") {
            player1Buttons[0] = false;
        } else if (e.key == "s") {
            player1Buttons[1] = false;
        }

        if (player1Buttons[0] && player1Buttons[1]) {
            player1.direction = Direction.NONE;
        } else if (player1Buttons[0]) {
            player1.direction = Direction.UP;
        } else if (player1Buttons[1]) {
            player1.direction = Direction.DOWN;
        } else {
            player1.direction = Direction.NONE;
        }

        if (humans == 2) {
            if (e.key == "ArrowUp") {
                player2Buttons[0] = false;
            } else if (e.key == "ArrowDown") {
                player1Buttons[1] = false;
            }
            
            if (player2Buttons[0] && player2Buttons[1]) {
                player2.direction = Direction.NONE;
            } else if (player2Buttons[0]) {
                player2.direction = Direction.UP;
            } else if (player2Buttons[1]) {
                player2.direction = Direction.DOWN;
            } else {
                player2.direction = Direction.NONE;
            }
        }
    }
}

document.getElementById("startscreen-one").onclick = function () {
    humans = 1;
    document.getElementById("startscreen").style.display = "none";
    score = [0, 0];
    main();
}

document.getElementById("startscreen-two").onclick = function () {
    humans = 2;
    document.getElementById("startscreen").style.display = "none";
    score = [0, 0];
    main();
}

document.getElementById("losescreen-home").onclick = function () {
    document.getElementById("startscreen").style.display = "block";
    document.getElementById("losescreen").style.display = "none";
}

document.getElementById("losescreen-restart").onclick = function () {
    document.getElementById("losescreen").style.display = "none";
    score = [0, 0];
    main();
}

document.getElementById("resume").onclick = function () {
    pausetoggle();
}

document.getElementById("giveup").onclick = function () {
    clearInterval(loopInterval);
    score = [0, 0];
    ball = null;
    player1 = null;
    player2 = null;
    document.getElementById("pausescreen").style.display = "none";
    document.getElementById("startscreen").style.display = "block";
}

document.documentElement.ontouchstart = async function (e) {
    touchcontrols = true;
}

if ('ontouchstart' in document.documentElement) {
    document.getElementById("gamecanvas").ontouchstart = async function (e) {
        for (let touch of e.touches) {
            console.log(touch);
            if (touch.clientY > windowHeight / 2) {
                if (touch.clientX < windowWidth / 2) {
                    player1Buttons[1] = true;
                } else {
                    player2Buttons[1] = true;
                }
            } else {
                if (touch.clientX < windowWidth / 2) {
                    player1Buttons[0] = true;
                } else {
                    player2Buttons[0] = true;
                }
            }
        }

        if (humans > 0) {
            if (player1Buttons[0] && player1Buttons[1]) {
                player1.direction = Direction.NONE;
            } else if (player1Buttons[0]) {
                player1.direction = Direction.UP;
            } else if (player1Buttons[1]) {
                player1.direction = Direction.DOWN;
            } else {
                player1.direction = Direction.NONE;
            }

            if (humans == 2) {
                if (player2Buttons[0] && player2Buttons[1]) {
                    player2.direction = Direction.NONE;
                } else if (player2Buttons[0]) {
                    player2.direction = Direction.UP;
                } else if (player2Buttons[1]) {
                    player2.direction = Direction.DOWN;
                } else {
                    player2.direction = Direction.NONE;
                }
            }
        }
    }

    document.getElementById("gamecanvas").ontouchend = async function (e) {
        for (let touch of e.changedTouches) {
            if (touch.clientY > windowHeight / 2) {
                if (touch.clientX < windowWidth / 2) {
                    player1Buttons[1] = false;
                } else {
                    player2Buttons[1] = false;
                }
            } else {
                if (touch.clientX < windowWidth / 2) {
                    player1Buttons[0] = false;
                } else {
                    player2Buttons[0] = false;
                }
            }
        }

        if (humans > 0) {
            if (player1Buttons[0] && player1Buttons[1]) {
                player1.direction = Direction.NONE;
            } else if (player1Buttons[0]) {
                player1.direction = Direction.UP;
            } else if (player1Buttons[1]) {
                player1.direction = Direction.DOWN;
            } else {
                player1.direction = Direction.NONE;
            }

            if (humans == 2) {
                if (player2Buttons[0] && player2Buttons[1]) {
                    player2.direction = Direction.NONE;
                } else if (player2Buttons[0]) {
                    player2.direction = Direction.UP;
                } else if (player2Buttons[1]) {
                    player2.direction = Direction.DOWN;
                } else {
                    player2.direction = Direction.NONE;
                }
            }
        }
    }
}
