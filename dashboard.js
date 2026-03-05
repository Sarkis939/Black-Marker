const nameInput = document.getElementById("boardName");
const contentInput = document.getElementById("boardContent");
const saveBtn = document.getElementById("saveBtn");
const backBtn = document.getElementById("backBtn");

let boards = JSON.parse(localStorage.getItem("flavortownBoards") || "[]");
let currentIndex = localStorage.getItem("currentBoardIndex");

if (currentIndex !== null && boards[currentIndex]) {
    const board = boards[currentIndex];
    nameInput.value = board.name;
    contentInput.value = board.data.content;
}

saveBtn.addEventListener("click", () => {
    const boardData = {
        name: nameInput.value || "Untitled Board",
        content: contentInput.value
    };

    if (currentIndex !== null) {
        boards[currentIndex] = {
            name: boardData.name,
            data: boardData
        };
    } else {
        boards.push({
            name: boardData.name,
            data: boardData
        });
        currentIndex = boards.length - 1;
        localStorage.setItem("currentBoardIndex", currentIndex);
    }

    localStorage.setItem("flavortownBoards", JSON.stringify(boards));
    alert("Board saved!");
});

backBtn.addEventListener("click", () => {
    window.location.href = "home.html";
});
