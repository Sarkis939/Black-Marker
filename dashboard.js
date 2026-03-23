const newBoardBtn = document.getElementById("newBoardBtn");
const boardsList = document.getElementById("boardsList");

let boards = JSON.parse(localStorage.getItem("flavortownBoards") || "[]");

newBoardBtn.addEventListener("click", () => {
  localStorage.removeItem("currentBoardIndex");
  window.location.href = "index.html";
});

function renderBoards() {
  boards = JSON.parse(localStorage.getItem("flavortownBoards") || "[]");
  boardsList.innerHTML = "";

  boards.forEach((board, index) => {
    const li = document.createElement("li");
    li.textContent = board.name;

    li.onclick = () => {
      localStorage.setItem("currentBoardIndex", index);
      window.location.href = "index.html";
    };

    boardsList.appendChild(li);
  });
}

renderBoards();
