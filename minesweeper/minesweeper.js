var cells = [];
var boardWidth = 0;
var boardHeight = 0;
var firstClick = false;
var startTime = 0;
var flagsRemaining = 0;
var timerEnable = false;
var winTime = -1;
var lastPauseStart = 0;

var keyboardSelection = [-1, -1];

const Modes = {
    EASY: 0.15,
    MEDIUM: 0.25,
    HARD: 0.35
}

var mode = Modes.EASY;

function formatTime(time) {
    let minutes = Math.floor(time / 60000);
    let seconds = Math.floor((time % 60000) / 1000);
    return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

async function loseGame() {
    timerEnable = false;
    let lose = document.getElementById("losescreen");
    lose.style.display = "block";
}

async function winGame() {
    winTime = new Date() - startTime;
    timerEnable = false;
    // Format time to MM:SS
    document.getElementById("winscreen-stats-time-value").innerText = formatTime(winTime);
    document.getElementById("winscreen-stats-bombs-value").innerText = countMines();
    let win = document.getElementById("winscreen");
    win.style.display = "block";
    console.log("WON");
}

async function checkIfWon() {
    // If every mine is flagged, win
    let wonMinesFlagged = true;
    let wonCellsOpened = true;
    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            if ((cells[i][j].mine && !cells[i][j].flagged)) {
                wonMinesFlagged = false;
            } else if (!cells[i][j].mine && !cells[i][j].revealed) {
                wonCellsOpened = false
            }
        }
    }

    if (wonMinesFlagged || wonCellsOpened) {
        winGame();
    }
}

async function updateHTMLFlagCount() {
    let flagCount = document.getElementById("flagcount-value");
    flagCount.innerText = flagsRemaining;
}


class Cell {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} isMine 
     */
    constructor(x, y, isMine) {
        this.mine = isMine;
        this.x = x;
        this.y = y;
        this.flagged = false;
        this.revealed = false;
    }

    /**
     * @param {boolean} recursive
    */ 
    async reveal(recursive) {
        if (recursive == null) {
            recursive = false;
        }
        
        if (this.revealed && !recursive) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i == 0 && j == 0) {
                        continue;
                    }
                    let adjacentCell = cells[this.x + i][this.y + j];
                    if (!adjacentCell.flagged && !adjacentCell.revealed) {
                        adjacentCell.reveal(true);
                    }
                }
            }
        }
        
        if (this.flagged || this.revealed) {
            return;
        }
        if (firstClick && !recursive) {
            if (this.mine || this.adjacentMines() != 0) {
                do {
                    generateJSBoard(boardHeight, boardWidth, mode);
                } while (cells[this.x][this.y].mine || cells[this.x][this.y].adjacentMines() != 0);
                firstClick = false;
                timerEnable = true;
                flagsRemaining = Math.floor(boardWidth * boardHeight * mode);
                updateHTMLFlagCount();
                startTime = new Date().getTime() - 1000;
                updateTimer();
                cells[this.x][this.y].reveal();
                return;
            }
        }

        if (this.mine) {
            loseGame();
        } else {
            if (!recursive) {
                checkIfWon();
            }
            this.revealed = true;
            if (this.adjacentMines() == 0) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (this.x + i >= 0 && this.x + i < boardWidth && this.y + j >= 0 && this.y + j < boardHeight) {
                            if (!cells[this.x + i][this.y + j].revealed && !cells[this.x + i][this.y + j].flagged && !cells[this.x + i][this.y + j].mine) {
                                cells[this.x + i][this.y + j].reveal(true);
                            }
                        }
                    }
                }
            }
            let thisCell = document.getElementById(this.x + "-" + this.y);
            thisCell.classList.add("revealed");
            let adjacentMines = this.adjacentMines();
            thisCell.innerText = adjacentMines == 0 ? "" : adjacentMines;
        }
    }

    adjacentMines() {
        let count = 0;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (this.x + i >= 0 && this.x + i < boardWidth && this.y + j >= 0 && this.y + j < boardHeight) {
                    if (cells[this.x + i][this.y + j].mine) {
                        count++;
                    }
                }
            }
        }

        return count;
    }

    async flag() {
        if (this.revealed) {
            return;
        }

        this.flagged = !this.flagged;

        if (this.flagged) {
            if (flagsRemaining > 0) {
                document.getElementById(this.x + "-" + this.y).innerHTML = "&#128681;";
                flagsRemaining--;
            } else {
                this.flagged = false;
                return;
            }
        } else {
            document.getElementById(this.x + "-" + this.y).innerHTML = "";
            flagsRemaining++;
        }

        checkIfWon();
        updateHTMLFlagCount();
    }
}

function countUnflaggedMines() {
    let count = 0;
    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            if (cells[i][j].mine && !cells[i][j].flagged) {
                count++;
            }
        }
    }
    return count;
}

function countMines() {
    let count = 0;

    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            if (cells[i][j].mine) {
                count++;
            }
        }
    }

    return count;
}

function generateJSBoard(rows, cols, minePercentage) {
    boardWidth = cols;
    boardHeight = rows;
    cells = [];
    firstClick = true;
    
    let mines = Math.floor(minePercentage * rows * cols);
    console.log("Generating board: " + rows + "x" + cols + " with " + mines + " mines");

    flagsRemaining = 0;
    updateHTMLFlagCount();

    for (let i = 0; i < rows; i++) {
        cells[i] = [];
        for (let j = 0; j < cols; j++) {
            cells[i][j] = new Cell(i, j, false);
        }
    }

    for (let i = 0; i < mines; i++) {
        let x = Math.floor(Math.random() * rows);
        let y = Math.floor(Math.random() * cols);

        if (cells[x][y].mine) {
            i--;
        } else {
            cells[x][y].mine = true;
        }
    }
}

function resetHTMLBoard() {
    let board = document.getElementById("board");
    board.innerHTML = "";
}

async function generateHTMLBoard() {
    let grid = document.createElement("table");
    grid.id = "grid";

    let board = document.getElementById("board");
    
    let cellSide = Math.floor(Math.min(window.innerWidth * 0.9 / boardWidth, window.innerHeight * 0.85 / boardHeight));

    board.style.width = (cellSide * boardWidth) + "px";
    board.style.height = (cellSide * boardHeight) + "px";

    grid.style.width = (cellSide * boardWidth) + "px";
    grid.style.height = (cellSide * boardHeight) + "px";

    for (let i = 0; i < boardHeight; i++) {
        let row = document.createElement("tr");

        for (let j = 0; j < boardWidth; j++) {
            let cell = document.createElement("td");
            cell.classList.add("cell");
            cell.style.width = cellSide + "px";
            cell.style.height = cellSide + "px";
            cell.style.maxWidth = cellSide + "px";
            cell.style.maxHeight = cellSide + "px";
            cell.style.minHeight = cellSide + "px";
            cell.style.minWidth = cellSide + "px";
            cell.style.fontSize = cellSide * 0.5 + "px";
            cell.setAttribute("id", `${i}-${j}`);
            cell.addEventListener("click", async function () {
                cells[i][j].reveal();
            });
            cell.addEventListener("contextmenu", async function (e) {
                e.preventDefault();
                cells[i][j].flag();
            });
            cell.addEventListener("dblclick", async function (e) {
                e.preventDefault();
            });

            row.appendChild(cell);
        }

        grid.appendChild(row);
    }

    document.getElementById("board").appendChild(grid);
}

async function main() {
    timerEnable = false;
    firstClick = true;
    updateTimer();
    resetHTMLBoard();
    generateJSBoard(16, 16, mode);
    generateHTMLBoard();
    document.getElementById("hud").style.width = document.getElementById("board").clientWidth + "px";
}

async function updateTimer() {
    // Update timer in format: MM:SS
    let timer = document.getElementById("timer");
    let time = new Date() - startTime;
    if (!timerEnable) {
        time = 0;
    }
    let minutes = Math.floor(time / 60000);
    let seconds = Math.floor((time % 60000) / 1000);
    timer.innerText = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

setInterval(updateTimer, 100);

document.body.onresize = async function () {
    console.log("Resizing board");
    resetHTMLBoard();
    await generateHTMLBoard();
    document.getElementById("hud").style.width = document.getElementById("board").clientWidth + "px";
}

async function hint() {
    let startTime = new Date().getTime();
    // Generate a random number between 0 (inclusive) and the number of unflagged mines (exclusive)
    let random = Math.floor(Math.random() * (countUnflaggedMines() + 1));
    let tempCount = 0;
    // Loop through all cells
    for (let i = 0; i < boardWidth; i++) {
        for (let j = 0; j < boardHeight; j++) {
            if (cells[i][j].mine && !cells[i][j].flagged) {
                // If the cell is a mine, increment tempCount
                if (tempCount == random) {
                    cells[i][j].flag();
                    return;
                }
                tempCount++;
            }
        }
    }

    checkIfWon();

    console.log("Hint took " + (new Date().getTime() - startTime) + "ms");
}


async function moveSelection(xOffset, yOffset) {
    if (keyboardSelection[0] == -1) {
        keyboardSelection[0] = 0;
        keyboardSelection[1] = 0;
    } else {
        document.getElementById(`${keyboardSelection[0]}-${keyboardSelection[1]}`).classList.remove("selected");
        if (keyboardSelection[0] + xOffset >= 0 && keyboardSelection[0] + xOffset < boardWidth) {
            keyboardSelection[0] += xOffset;
        }
        if (keyboardSelection[1] + yOffset >= 0 && keyboardSelection[1] + yOffset < boardHeight) {
            keyboardSelection[1] += yOffset;
        }
    }

    document.getElementById(`${keyboardSelection[0]}-${keyboardSelection[1]}`).classList.add("selected");
}

function pause() {
    if (new Date().getTime() - lastPauseStart < 1000) {
        lastPauseStart = new Date().getTime();
        timerEnable = false;
        document.getElementById("pausescreen").style.display = "block";
    }
}

function unpause() {
    timerEnable = true;
    startTime += new Date().getTime() - lastPauseStart;
    document.getElementById("pausescreen").style.display = "none";
}

document.documentElement.onkeydown = async function (e) {
    if (e.key == "ArrowUp") {
        moveSelection(-1, 0);
    } else if (e.key == "ArrowDown") {
        moveSelection(1, 0);
    } else if (e.key == "ArrowLeft") {
        moveSelection(0, -1);
    } else if (e.key == "ArrowRight") {
        moveSelection(0, 1);
    } else if (e.key == "Enter") {
        if (keyboardSelection[0] != -1) {
            cells[keyboardSelection[0]][keyboardSelection[1]].reveal();
        }
    } else if (e.key == " ") {
        if (keyboardSelection[0] != -1) {
            cells[keyboardSelection[0]][keyboardSelection[1]].flag();
        }
    } else if (e.key == "Escape") {
        keyboardSelection[0] = -1;
        keyboardSelection[1] = -1;
        document.getElementById(`${keyboardSelection[0]}-${keyboardSelection[1]}`).classList.remove("selected");
        pause();
    } else if (e.key == "h") {
        hint();
    }
}

document.getElementById("winscreen-restart").addEventListener("click", async function () {
    document.getElementById("winscreen").style.display = "none";
    main();
});

document.getElementById("winscreen-home").addEventListener("click", async function () {
    resetHTMLBoard();
    document.getElementById("winscreen").style.display = "none";
    document.getElementById("startscreen").style.display = "block";
});

document.getElementById("losescreen-restart").addEventListener("click", async function () {
    document.getElementById("losescreen").style.display = "none";
    main();
});

document.getElementById("losescreen-home").addEventListener("click", async function () {
    document.getElementById("losescreen").style.display = "none";
    document.getElementById("startscreen").style.display = "block";
});

document.getElementById("pausescreen-resume").addEventListener("click", async function () {
    unpause();
});

document.getElementById("pausescreen-home").addEventListener("click", async function () {
    unpause();
    resetHTMLBoard();
    document.getElementById("startscreen").style.display = "block";
});

document.getElementById("startscreen-easy").addEventListener("click", async function () {
    mode = Modes.EASY;
    document.getElementById("startscreen").style.display = "none";
    main();
});

document.getElementById("startscreen-medium").addEventListener("click", async function () {
    mode = Modes.MEDIUM;
    document.getElementById("startscreen").style.display = "none";
    main();
});

document.getElementById("startscreen-hard").addEventListener("click", async function () {
    mode = Modes.HARD;
    document.getElementById("startscreen").style.display = "none";
    main();
});

// When element with the id hud-flagcount is clicked, flag a random mine
document.getElementById("hud-flagcount").onclick = async function () {
    hint();
}
document.getElementById("hud-flagcount").ondblclick = function (e) {
    e.preventDefault();
    document.getElementById("hud-flagcount").onclick();
}


main();