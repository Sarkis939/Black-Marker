const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let objects = [];
let tool = "select";
let color = "#000000";
let isDrawing = false;
let isErasing = false;
let draggingPath = null;
let eraserRadius = 20;

let camera = { x: 0, y: 0, zoom: 1 };

const container = document.createElement("div");
container.style.position = "absolute";
container.style.top = 0;
container.style.left = 0;
container.style.pointerEvents = "none";
document.body.appendChild(container);

// TOOL BUTTONS
document.querySelectorAll("[data-tool]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-tool]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    tool = btn.dataset.tool;
  };
});

document.getElementById("colorPicker").oninput = e => color = e.target.value;
document.getElementById("eraserSize").oninput = e => eraserRadius = parseInt(e.target.value);

// BOARDS SYSTEM
let boards = JSON.parse(localStorage.getItem("flavortownBoards") || "[]");
let currentIndex = localStorage.getItem("currentBoardIndex");
if (currentIndex !== null) currentIndex = parseInt(currentIndex);

// LOAD BOARD
if (currentIndex !== null && boards[currentIndex]) {
  objects = JSON.parse(boards[currentIndex].data.content);
}

// SAVE BOARD
function saveBoard() {
  let boardData = {
    name: "Board " + (currentIndex !== null ? currentIndex + 1 : boards.length + 1),
    content: JSON.stringify(objects)
  };

  if (currentIndex !== null && boards[currentIndex]) {
    boards[currentIndex] = { name: boardData.name, data: boardData };
  } else {
    boards.push({ name: boardData.name, data: boardData });
    currentIndex = boards.length - 1;
    localStorage.setItem("currentBoardIndex", currentIndex);
  }

  localStorage.setItem("flavortownBoards", JSON.stringify(boards));
  alert("Saved!");
}

document.getElementById("saveBtn").onclick = saveBoard;

document.getElementById("backBtn").onclick = () => {
  window.location.href = "home.html";
};

// MOUSE POSITION
function getMouse(e) {
  return {
    x: (e.offsetX - camera.x) / camera.zoom,
    y: (e.offsetY - camera.y) / camera.zoom
  };
}

// EVENTS
canvas.addEventListener("pointerdown", start);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", end);

function start(e) {
  const { x, y } = getMouse(e);

  if (tool === "draw") {
    isDrawing = true;
    draggingPath = { type: "path", points: [{ x, y }], color };
    objects.push(draggingPath);
  }

  if (tool === "erase") {
    isErasing = true;
    eraseAt(x, y);
  }

  if (tool === "text") {
    objects.push({ type: "text", x, y, text: "text", color });
  }

  if (tool === "sticky") {
    objects.push({ type: "sticky", x, y, text: "note", color });
  }

  draw();
}

function move(e) {
  const { x, y } = getMouse(e);

  if (tool === "draw" && isDrawing && draggingPath) {
    draggingPath.points.push({ x, y });
    draw();
  }

  if (tool === "erase" && isErasing) {
    eraseAt(x, y);
    draw();
  }
}

function end() {
  isDrawing = false;
  isErasing = false;
  draggingPath = null;
}

// ERASER
function eraseAt(x, y) {
  objects = objects.filter(obj => {
    if (obj.type !== "path") return true;

    return obj.points.every(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) > eraserRadius;
    });
  });
}

// DRAW
function draw() {
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, camera.x, camera.y);
  ctx.clearRect(-camera.x, -camera.y, canvas.width, canvas.height);

  objects.forEach(obj => {
    if (obj.type === "path") {
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      obj.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });

      ctx.stroke();
    }
  });
}

// START
window.onload = () => {
  draw();
};
