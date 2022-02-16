const GRID_SIZE = 9;
var board = [];
var selectedCell = [0, 0];
var globalDifficulty = "medium";
var gameStartTime = 0;

// Valid difficulties: easy, medium, hard, random

/**
 * 
 * @param {number[][]} board 
 * @returns {number[][]} board with all 0s filled in
 */
function resetBoard(board) {
    for (let i = 0; i < GRID_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            board[i][j] = 0;
        }
    }
    return board;
}

/**
 * 
 * @param {number[][]} board 
 * @returns {boolean} whether the board is filled with numbers
 */
async function isBoardSolved(board) {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] == 0) {
                return false;
            }
        }
    }
    return true;
}

/**
 * 
 * @param {number[][]} board 
 * @param {number} row index of row inside of board
 * @returns whether the row is valid (no duplicates)
 */
function checkRow(board, row) {
    let tempBoard = board;
    let rowArray = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        rowArray.push(tempBoard[row][i]);
    }
    let sortedRow = rowArray.sort();
    for (let i = 0; i < GRID_SIZE; i++) {
        if (sortedRow[i] != i + 1) {
            return false;
        }
    }
    return true;
}


/**
 * 
 * @param {number[][]} board 
 * @param {number} column index of column inside board
 * @returns {boolean} whether the column is valid (no duplicates)
 */
function checkColumn(board, column) {
    let tempBoard = board;
    let columnArray = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        columnArray.push(tempBoard[i][column]);
    }
    let sortedColumn = columnArray.sort();
    for (let i = 0; i < GRID_SIZE; i++) {
        if (sortedColumn[i] != i + 1) {
            return false;
        }
    }
    return true;
}


/**
 * 
 * @param {number[][]} board 
 * @param {number} blockleft
 * @param {number} blocktop
 * @returns {boolean} whether the block is valid (no duplicates)
 */
function checkBlock(board, blockleft, blocktop) {
    let templist = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            templist.push(board[blocktop * 3 + i][blockleft * 3 + j]);
        }
    }
    let sortedBlock = templist.sort();
    for (let i = 0; i < 9; i++) {
        if (sortedBlock[i] != i + 1) {
            return false;
        }
    }

    return true;
}


/**
 * 
 * @param {number[][]} board 
 * @returns {boolean} whether a board has been correctly solved
 */
async function isBoardCorrect(board) {
    let tempBoard = JSON.parse(JSON.stringify(board));
    for (let i = 0; i < GRID_SIZE; i++) {
        if (!checkRow(tempBoard, i)) {
            console.log("found incorrect row");
            return false;
        }
    }

    tempBoard = JSON.parse(JSON.stringify(board));
    for (let i = 0; i < GRID_SIZE; i++) {
        if (!checkColumn(tempBoard, i)) {
            console.log("found incorrect column");
            return false;
        }
    }

    tempBoard = JSON.parse(JSON.stringify(board));
    for (let i = 0; i < GRID_SIZE / 3; i++) {
        for (let j = 0; j < GRID_SIZE / 3; j++) {
            if (!checkBlock(tempBoard, i, j)) {
                console.log("found incorrect block");
                return false;
            }
        }
    }

    return true;
}


/**
 * 
 * @param {number[][]} board 
 * @param {string} difficulty 
 * @returns {number[][]} a random board from the SuGoKu API by bertoort
 */
async function randomBoard(board, difficulty) {
    console.log("Fetching random board...");
    let startTime = new Date().valueOf();
    // Fetch json data from https://sugoku2.herokuapp.com/board?difficulty=hard
    let url = "https://sugoku2.herokuapp.com/board?random=" + Math.floor(Math.random() * 100000) + "&difficulty=" + difficulty;
    console.log(url)
    let response = await fetch(url);
    response = await response.json();
    board = response.board;
    console.log("Random board loaded in " + String(Date.now().valueOf() - startTime) + "ms!");
    return board;
}

const encodeBoard = (board) => board.reduce((result, row, i) => result + `%5B${encodeURIComponent(row)}%5D${i === board.length -1 ? '' : '%2C'}`, '');

const encodeParams = (params) => 
  Object.keys(params)
  .map(key => key + '=' + `%5B${encodeBoard(params[key])}%5D`)
  .join('&');


/**
 * 
 * @param {number[][]} board 
 * @returns {number[][]} a solution to the given board
 */
async function solvedBoard(board) {
    let url = "https://sugoku2.herokuapp.com/solve"

    // Send the board to url in the form of x-www-form-urlencoded
    let response = await fetch(url, {
        method: 'POST',
        body: encodeParams({board: board}),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    response = await response.json();
    board = response.solution;
    return board;
}

async function markAll(board, number) {
    // Mark all the cells with the number
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] == number) {
                document.getElementById(`${i}${j}`).style.backgroundColor = "orange";
            } else {
                document.getElementById(`${i}${j}`).style.backgroundColor = "";
            }
        }
    }
}


function selectCell(cell) {
    let row = cell.id.charAt(0);
    let col = cell.id.charAt(1);

    document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.remove("selected");

    selectedCell[0] = row;
    selectedCell[1] = col;

    document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.add("selected");
    if (!cell.classList.contains("static")) {
        document.getElementById("forceinput").focus();
    } else {
        markAll(board, board[row][col]);
        cell.focus();
    }
}

async function generateHTMLBoard(board) {
    let grid = document.createElement("div");
    grid.setAttribute("id", "grid");
    grid.setAttribute("class", "grid");
    let blockSize =  Math.floor(Math.pow(GRID_SIZE, 0.5));
    for (let i = 0; i < blockSize; i++) {
        for (let j = 0; j < blockSize; j++) {
            let block = document.createElement("table");
            block.setAttribute("class", "block");
            block.setAttribute("id", `block-${i}-${j}`);
            for (let k = 0; k < blockSize; k++) {
                for (let l = 0; l < blockSize; l++) {
                    let cell = document.createElement("td");
                    cell.classList.add("cell");
                    cell.setAttribute("id", `${i * blockSize + k}${j * blockSize + l}`);
                    if (board[i * blockSize + k][j * blockSize + l] != 0) {
                        cell.innerHTML = board[i * blockSize + k][j * blockSize + l];
                        cell.classList.add("static");
                    } else {
                        cell.innerHTML = "&nbsp;";
                    }
                    cell.setAttribute("onclick", "selectCell(this);");
                    block.appendChild(cell);
                }
            }
            grid.appendChild(block);
        }
    }

    document.getElementById("board").appendChild(grid);
    document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).setAttribute("class", "cell selected");
}

async function resetHTML() {
    document.getElementById("board").innerHTML = "";
}


async function startGame(difficulty) {
    resetBoard(board);
    document.getElementById("board").innerHTML = "";
    document.getElementById("loadwarn").style.display = "block";
    document.getElementById("startscreen").style.display = "none";
    document.getElementById("winscreen").style.display = "none";
    board = await randomBoard(board, difficulty);
    console.log(await isBoardCorrect(board));
    selectedCell = [0, 0];
    generateHTMLBoard(board).then(function () {
        document.getElementById("loadwarn").style.display = "none";
        if (board[0][0] != 0) {
            document.getElementById("00").classList.add("static");
        }
        gameStartTime = new Date().valueOf();
    });
}


async function checkIfWon() {
    if (await isBoardSolved(board)) {
        if (await isBoardCorrect(board)) {
            document.getElementById("winscreen-time").innerText = String(Math.floor((Date.now().valueOf() - gameStartTime) / 1000));
            document.getElementById("winscreen").style.display = "block";
        }
    }
}

async function solveGame() {
    board = await solvedBoard(board);
    checkIfWon();
    resetHTML();
    generateHTMLBoard(board);
}

document.documentElement.onkeyup = function (e) {
    let oldSelectedCell = [0, 0];
    oldSelectedCell[0] = selectedCell[0];
    oldSelectedCell[1] = selectedCell[1];
    let prevent = e.preventDefault;
    e = e.key;
    if (e >= 0 && e <= 9) {
        if (document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.contains("static")) {
            return;
        }
        board[selectedCell[0]][selectedCell[1]] = e;
        document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).innerHTML = (e == 0 ? "&nbsp;" : e);
        checkIfWon();
        document.documentElement.focus();
    } else if (e == "ArrowUp") {
        if (selectedCell[0] > 0) {
            selectedCell[0]--;
        }
    } else if (e == "ArrowDown") {
        if (selectedCell[0] < GRID_SIZE - 1) {
            selectedCell[0]++;
        }
    } else if (e == "ArrowLeft") {
        if (selectedCell[1] > 0) {
            selectedCell[1]--;
        }
    } else if (e == "ArrowRight") {
        if (selectedCell[1] < GRID_SIZE - 1) {
            selectedCell[1]++;
        }
    } else if (e == "Backspace") {
        if (document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.contains("static")) {
            return;
        }
        board[selectedCell[0]][selectedCell[1]] = 0;
        document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).innerHTML = "&nbsp;";
    } else if (e == " ") {
        prevent();
        if (document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.contains("static")) {
            markAll(board, board[selectedCell[0]][selectedCell[1]]);
            return;
        }
        board[selectedCell[0]][selectedCell[1]] = 0;
        document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).innerHTML = "&nbsp;";
    } else if (e == "Enter") {
        if (document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.contains("static")) {
            markAll(board, board[selectedCell[0]][selectedCell[1]]);
        }
        document.documentElement.focus();
    }


    // set the selected cell to be the one with the id of the selected cell
    if (oldSelectedCell[0] != selectedCell[0] || oldSelectedCell[1] != selectedCell[1]) {
        document.getElementById(`${oldSelectedCell[0]}${oldSelectedCell[1]}`).classList.remove("selected");
        document.getElementById(`${selectedCell[0]}${selectedCell[1]}`).classList.add("selected");
    }
}

document.getElementById("forceinput").onkeyup = function (e) {
    e.preventDefault();
    console.log("f");
};

document.getElementById("startscreen-easy").onclick = () => startGame("easy");
document.getElementById("startscreen-medium").onclick = () => startGame("medium");
document.getElementById("startscreen-hard").onclick = () => startGame("hard");
document.getElementById("startscreen-random").onclick = () => startGame("random");

document.getElementById("winscreen-easy").onclick = () => startGame("easy");
document.getElementById("winscreen-medium").onclick = () => startGame("medium");
document.getElementById("winscreen-hard").onclick = () => startGame("hard");
document.getElementById("winscreen-random").onclick = () => startGame("random");
document.getElementById("winscreen-home").onclick = () => {
    document.getElementById("winscreen").style.display = "none";
    document.getElementById("startscreen").style.display = "block";
}

console.log("╔══════════════════════════════════╗");
console.log("║   Sudoku by Tobias Kendlbacher   ║");
console.log("║   https://github.com/kendlbat    ║");
console.log("║                                  ║");
console.log("║ Special thanks to:               ║");
console.log("║   - Roberto Ortega (bertoort)    ║");
console.log("║     https://github.com/bertoort  ║");
console.log("║     For his sugoku API.          ║");
console.log("╚══════════════════════════════════╝");
