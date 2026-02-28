const boardsList = document.getElementById("boardsList");
const newBoardBtn = document.getElementById("newBoardBtn");
const fileInput = document.getElementById("fileInput");

// Load boards from localStorage
let boards = JSON.parse(localStorage.getItem("flavortownBoards") || "[]");

function renderBoards() {
    boardsList.innerHTML = "";
    boards.forEach((board, index) => {
        const li = document.createElement("li");
        li.textContent = board.name || `Board ${index+1}`;
        li.addEventListener("click", () => openBoard(board.data));
        boardsList.appendChild(li);
    });
}

// Open a board
function openBoard(data) {
    localStorage.setItem("currentBoard", JSON.stringify(data));
    window.open("index.html", "_blank");
}

// Create new board
newBoardBtn.addEventListener("click", () => {
    localStorage.removeItem("currentBoard");
    window.open("index.html", "_blank");
});

// Optional: upload JSON file to dashboard
fileInput.addEventListener("change", e => {
    const reader = new FileReader();
    reader.onload = ev => {
        const data = JSON.parse(ev.target.result);
        boards.push({ name: `Board ${boards.length+1}`, data });
        localStorage.setItem("flavortownBoards", JSON.stringify(boards));
        renderBoards();
    };
    reader.readAsText(fileInput.files[0]);
});

renderBoards();