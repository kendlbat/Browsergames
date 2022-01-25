class Snake {
    constructor(length) {
        this.length = length;
        this.headPos = [0, 0];
        this.body = [];
        this.headDirection = [-1, 0];
        this.lastTailPos = [0, 0];
    }

    addSquareAtEnd() {
        let newSquare = [this.lastTailPos[0], this.lastTailPos[1]];
        this.body.push(newSquare);
        this.length += 1;
    }

    /*
    Moves the snake in the currently set directions
    If movement is successful, return true
    If movement is not successful (i.e. collision), return false
    */
    async move() {
        this.body.unshift([this.headPos[0], this.headPos[1]]);
        this.headPos[0] += this.headDirection[0];
        this.headPos[1] += this.headDirection[1];
        this.lastTailPos = this.body.pop();

        return !this.checkCollision();
    }

    generate() {
        for (let i = 1; i < this.length; i++) {
            this.body.push([this.headPos[0] + i, this.headPos[1]]);
        }
    }

    async draw() {
        // Go through every cell on the grid and check if there is a snake body or the head
        let newGrid = [];

        for (let i = 0; i < rowAmount; i++) {
            newGrid.push([]);
            for (let j = 0; j < colAmount; j++) {
                let cellClass = "";
                
                if (i == this.headPos[0] && j == this.headPos[1]) {
                    cellClass = "head";
                } else {
                    for (let element of this.body) {
                        if (element[0] == i && element[1] == j) {
                            cellClass = "snake";
                        }
                    }
                }

                if (cellClass == "" && i == apple[0] && j == apple[1]) {
                    cellClass = "apple";
                }

                newGrid[i].push(cellClass);
            }
        }

        // loop through newGrid and set the corresponding cells classes
        for (let i = 0; i < newGrid.length; i++) {
            for (let j = 0; j < newGrid[i].length; j++) {
                let cell = document.getElementById(`${i}-${j}`);
                cell.className = "cell " + newGrid[i][j];
            }
        }
    }

    checkCollision() {
        // Check if the snake has hit itself
        for (let i = 0; i < this.body.length; i++) {
            if (this.headPos[0] == this.body[i][0] && this.headPos[1] == this.body[i][1]) {
                return true;
            }
        }

        // Check if the snake has hit the wall
        if (this.headPos[0] < 0 || this.headPos[0] >= rowAmount || this.headPos[1] < 0 || this.headPos[1] >= colAmount) {
            return true;
        }

        return false;
    }
}

async function generateBoard(columns) {
    // Board should be a table with id grid
    // Cells should have an aspectRatio of 1:1
    // The amount of cells per row should be the first argument
    // The amount of cells per column should be calculated based on the amount of cells per row, to take up less than 100% of board

    // Create a table
    let table = document.createElement('table');
    table.id = 'grid';
    table.style.width = '100%';
    table.style.height = '100%';

    // Calculate cell width (board width) / columns
    let cellwidth = document.getElementById('board').offsetWidth / columns;

    // Calculate amount of rows
    let rowamount = Math.floor(document.getElementById('board').offsetHeight / cellwidth);

    rowAmount = rowamount;
    colAmount = columns;

    // Create rows
    for (let i = 0; i < rowamount; i++) {
        let row = document.createElement('tr');
        for (let j = 0; j < columns; j++) {
            let cell = document.createElement('td');
            cell.style.width = cellwidth + 'px';
            cell.style.height = cellwidth + 'px';
            cell.id = `${i}-${j}`;
            cell.classList.add("cell")
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    // Append table to board
    document.getElementById('board').appendChild(table);
}

function checkIfAppleCollidesWithSnake() {
    if (snake.headPos[0] == apple[0] && snake.headPos[1] == apple[1]) {
        return true;
    }

    for (let element of snake.body) {
        if (element[0] == apple[0] && element[1] == apple[1]) {
            return true;
        }
    }

    return false;
}

async function generateNewApplePos() {
    do {
        apple[0] = Math.floor(Math.random() * rowAmount);
        apple[1] = Math.floor(Math.random() * colAmount);
    } while (checkIfAppleCollidesWithSnake());
}

function eatApple() {
    snake.addSquareAtEnd();
    score++;
    generateNewApplePos();
}


function lose() {
    document.getElementById("losescreen-score").innerText = score;
    document.getElementById("losescreen-restart").onclick = restart;
    document.getElementById("losescreen").style.display = "block";
}


async function updateUI() {
    document.getElementById('score-value').innerHTML = score;
}

var rowAmount = 0;
var colAmount = 0;
var snake = null;
var directionsPressed = [0, 0];
var apple = [0, 0];
var speed = 10;
var gameloopInterval = null;
var msSinceLastFrame = 0;
var score = 0;
var hasDrawnSinceLastUpdate = false;
var paused = false;
var pauseCooldown = 0;


async function gameloop () {
    if (directionsPressed[0] != 0 || directionsPressed[1] != 0) {
        if (directionsPressed[0] == 1 && snake.headDirection[0] != -1) {
            snake.headDirection[0] = 1;
            snake.headDirection[1] = directionsPressed[1];
        } else if (directionsPressed[0] == -1 && snake.headDirection[0] != 1) {
            snake.headDirection[0] = -1;
            snake.headDirection[1] = directionsPressed[1];
        } else if (directionsPressed[1] == 1 && snake.headDirection[1] != -1) {
            snake.headDirection[0] = directionsPressed[0];
            snake.headDirection[1] = 1;
        } else if (directionsPressed[1] == -1 && snake.headDirection[1] != 1) {
            snake.headDirection[0] = directionsPressed[0];
            snake.headDirection[1] = -1;
        }
    }

    snake.move().then((success) => {
        if (!success) {
            clearInterval(gameloopInterval);
            lose();
        }
    });

    if (checkIfAppleCollidesWithSnake()) {
        eatApple();
    }
}


async function gameloopIntervalFunction() {
    msSinceLastFrame += 10;
    if (pauseCooldown > 0) {
        pauseCooldown -= 10;
    }

    if (!hasDrawnSinceLastUpdate && msSinceLastFrame < (1000 / speed) && msSinceLastFrame > 10) {
        snake.draw();
    }

    if (msSinceLastFrame >= (1000 / speed)) {
        gameloop();
        updateUI();
        msSinceLastFrame = 0;
    }
}


async function start() {
    document.getElementById("startscreen").style.display = "none";
    main();
}

async function restart() {
    document.getElementById("losescreen").style.display = "none";
    main();
}

async function giveup() {
    unpause();
    clearInterval(gameloopInterval);
    document.getElementById("startscreen").style.display = "block";
    document.getElementById("startscreen-start").onclick = start;
}

async function pause() {
    if (pauseCooldown <= 0) {
        clearInterval(gameloopInterval);
        paused = true;
        document.getElementById("resume").onclick = unpause;
        document.getElementById("giveup").onclick = giveup;
        document.getElementById("pausescreen").style.display = "block";
    }
}

async function unpause() {
    pauseCooldown = 1000;
    paused = false;
    document.getElementById("pausescreen").style.display = "none";
    gameloopInterval = setInterval(gameloopIntervalFunction, 10);
}


async function main() {
    snake = null;
    directionsPressed = [0, 0];
    document.getElementById("board").innerHTML = "";

    if (window.innerWidth <= 600) {
        await generateBoard(16);
    } else {
        await generateBoard(32);
    }

    snake = new Snake(4);

    // Set the snake's head position to the middle of the board
    snake.headPos = [Math.floor(rowAmount / 2), Math.floor(colAmount / 2)];
    snake.generate();
    generateNewApplePos();
    snake.draw();

    gameloopInterval = setInterval(gameloopIntervalFunction, 10);
}

document.documentElement.onkeydown = function (e) {
    console.log("Key pressed: " + e.key);

    switch (e.key) {
        case "w":
            if (directionsPressed[0] != 1) {
                directionsPressed[0] = -1;
                directionsPressed[1] = 0;
            }
            break;
        case "s":
            if (directionsPressed[0] != -1) {
                directionsPressed[0] = 1;
                directionsPressed[1] = 0;
            }
            break;
        case "a":
            if (directionsPressed[1] != 1) {
                directionsPressed[0] = 0;
                directionsPressed[1] = -1;
            }
            break;
        case "d":
            if (directionsPressed[1] != -1) {
                directionsPressed[0] = 0;
                directionsPressed[1] = 1;
            }
            break;
        case "ArrowUp":
            if (directionsPressed[0] != 1) {
                directionsPressed[0] = -1;
                directionsPressed[1] = 0;
            }
            break;
        case "ArrowDown":
            if (directionsPressed[0] != -1) {
                directionsPressed[0] = 1;
                directionsPressed[1] = 0;
            }
            break;
        case "ArrowLeft":
            if (directionsPressed[1] != 1) {
                directionsPressed[0] = 0;
                directionsPressed[1] = -1;
            }
            break;
        case "ArrowRight":
            if (directionsPressed[1] != -1) {
                directionsPressed[0] = 0;
                directionsPressed[1] = 1;
            }
            break;
        
        case "Escape":
            if (paused) {
                unpause();
            } else {
                pause();
            }
            break;
    }
}

document.getElementById("mobile-up").onmousedown = function () {
    document.documentElement.onkeydown({key: "w"});
}

document.getElementById("mobile-down").onmousedown = function () {
    document.documentElement.onkeydown({key: "s"});
}

document.getElementById("mobile-left").onmousedown = function () {
    document.documentElement.onkeydown({key: "a"});
}

document.getElementById("mobile-right").onmousedown = function () {
    document.documentElement.onkeydown({key: "d"});
}

document.getElementById("startscreen-start").onclick = start;