class Players {
    static ONE = 1;
    static TWO = 2;
    static NONE = 0;

    static ONE_INDICATOR = '&#128308;';
    static TWO_INDICATOR = '&#128992;';
}

var gameState = [];
var turn = Players.ONE;
const humans = 2; // Too lazy to implement opponent AI, maybe at a later date

for (var i = 0; i < 6; i++) {
    gameState[i] = [];
    for (var j = 0; j < 7; j++) {
        gameState[i][j] = Players.NONE;
    }
}

function getCellSide() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cellSide = Math.min(width * 0.9 / 7, height * 0.9 / 6);
    return cellSide;
}

async function resizeBoard() {
    let cellSide = getCellSide();
    let board = document.getElementById("board");
    board.style.width = cellSide * 7 + "px";
    board.style.height = cellSide * 6 + "px";
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            let cell = document.getElementById(`${i}${j}`);
            cell.style.width = cellSide + "px";
            cell.style.height = cellSide + "px";
            cell.style.borderRadius = cellSide / 2 + "px";
            cell.style.aspectRatio = "1";
        }
    }
}

async function updateBoard() {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            let cell = document.getElementById(`${i}${j}`);
            if (gameState[i][j] == Players.ONE) {
                cell.classList.add("red");
            } else if (gameState[i][j] == Players.TWO) {
                cell.classList.add("yellow");
            }
        }
    }
}

async function dropInColumn(col, player) {
    console.log("Dropping in column " + col);
    for (let i = 5; i >= 0; i--) {
        if (gameState[i][col] == Players.NONE) {
            gameState[i][col] = player;
            updateBoard();
            return true;
        }
    }
    return false;
}

async function winGame(player) {
    let winscreen = document.getElementById("winscreen");
    let winner = document.getElementById("winner");
    winscreen.style.display = "block";
    if (player == Players.ONE) {
        winner.innerHTML = Players.ONE_INDICATOR + " wins!";
    } else if (player == Players.TWO) {
        winner.innerHTML = Players.TWO_INDICATOR + " wins!";
    } else {
        winner.innerHTML = "Tie!";
    }
} 

async function checkForWinner() {
    // Check if anywhere on the board is a winning combination
    // If so, display the winner
    // If not, check if the board is full
    // If so, display a tie

    // Check horizontal
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j <= 3; j++) {
            if (gameState[i][j] != Players.NONE && gameState[i][j] == gameState[i][j + 1] && gameState[i][j] == gameState[i][j + 2] && gameState[i][j] == gameState[i][j + 3]) {
                winGame(gameState[i][j]);
            }
        }
    }

    // Check vertical
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j < 7; j++) {
            if (gameState[i][j] != Players.NONE && gameState[i][j] == gameState[i + 1][j] && gameState[i][j] == gameState[i + 2][j] && gameState[i][j] == gameState[i + 3][j]) {
                winGame(gameState[i][j]);
            }
        }
    }

    // Check diagonals (top left to bottom right)
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= 3; j++) {
            if (gameState[i][j] != Players.NONE && gameState[i][j] == gameState[i + 1][j + 1] && gameState[i][j] == gameState[i + 2][j + 2] && gameState[i][j] == gameState[i + 3][j + 3]) {
                winGame(gameState[i][j]);
            }
        }
    }

    // Check diagonals (top right to bottom left)
    for (let i = 0; i <= 2; i++) {
        for (let j = 3; j < 7; j++) {
            if (gameState[i][j] != Players.NONE && gameState[i][j] == gameState[i + 1][j - 1] && gameState[i][j] == gameState[i + 2][j - 2] && gameState[i][j] == gameState[i + 3][j - 3]) {
                winGame(gameState[i][j]);
            }
        }
    }

    // Check if the board is full
    let full = true;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (gameState[i][j] == Players.NONE) {
                full = false;
            }
        }
    }

    if (full) {
        winGame(Players.NONE);
    }
}

async function setClickEvents() {
    // Set click events for each cell
    // drop a piece in that column
    // if drop is successful, check for winner and change turn
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            let cell = document.getElementById(`${i}${j}`);
            cell.onclick = function() {
                if (turn == Players.ONE) {
                    if (humans > 0) {
                        if (dropInColumn(j, Players.ONE)) {
                            turn = Players.TWO;
                            document.getElementById("turn-status").innerHTML = Players.TWO_INDICATOR;
                            checkForWinner();
                        }
                    }
                } else if (turn == Players.TWO) {
                    if (humans == 2) {
                        if (dropInColumn(j, Players.TWO)) {
                            turn = Players.ONE;
                            document.getElementById("turn-status").innerHTML = Players.ONE_INDICATOR;
                            checkForWinner();
                        }
                    }
                }
            };
        }
    }
}

function resetGame() {
    // Reset the game state
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            gameState[i][j] = Players.NONE;
            let cell = document.getElementById(`${i}${j}`);
            turn = Players.ONE;
            document.getElementById("turn-status").innerHTML = Players.ONE_INDICATOR;
            cell.classList.remove("red");
            cell.classList.remove("yellow");
        }
    }
    updateBoard();
}

async function generateBoard() {
    let board = document.getElementById("game");
    let table = document.createElement("table");
    table.setAttribute("id", "board");

    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement("td");
            cell.setAttribute("id", `${i}${j}`);
            cell.classList.add("cell");
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    board.appendChild(table);
    resizeBoard();
}

async function main() {
    generateBoard();
    turn = Players.ONE;
    document.getElementById("turn-status").innerHTML = Players.ONE_INDICATOR;
    setClickEvents();
}

main();

document.body.onresize = resizeBoard;

document.getElementById("winscreen-home").onclick = function() {
    let winscreen = document.getElementById("winscreen");
    winscreen.style.display = "none";
    let startscreen = document.getElementById("startscreen");
    startscreen.style.display = "block";
}

document.getElementById("winscreen-restart").onclick = function() {
    resetGame();
    let winscreen = document.getElementById("winscreen");
    winscreen.style.display = "none";
}

document.getElementById("startscreen-two").onclick = function() {
    let startscreen = document.getElementById("startscreen");
    resetGame();
    startscreen.style.display = "none";
}
