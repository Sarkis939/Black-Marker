const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let objects = [];
let tool = "select";
let color = "#ff0000";

let dragging = null;
let isDrawing = false;

// ================= TOOL SELECT =================
document.querySelectorAll("[data-tool]").forEach(btn=>{
    btn.onclick = () => {
        document.querySelectorAll("[data-tool]").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        tool = btn.dataset.tool;
    };
});

document.getElementById("colorPicker").oninput = e => color = e.target.value;

// ================= SAVE / LOAD =================
document.getElementById("saveBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(objects)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flavortown_board.json";
    a.click();
};

document.getElementById("loadBtn").onclick = () =>
    document.getElementById("fileInput").click();

document.getElementById("fileInput").onchange = e => {
    const reader = new FileReader();
    reader.onload = ev => {
        objects = JSON.parse(ev.target.result);
        draw();
    };
    reader.readAsText(e.target.files[0]);
};

// ================= POINTER EVENTS =================
canvas.addEventListener("pointerdown", start);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", end);

function getMouse(e){
    return { x: e.offsetX, y: e.offsetY };
}

function start(e){
    const {x,y} = getMouse(e);

    if(tool==="draw"){
        isDrawing = true;
        const path = {type:"path", points:[{x,y}], color};
        objects.push(path);
        dragging = path;
    }

    if(tool==="text"){
        const t = prompt("Enter text:");
        if(t){
            objects.push({type:"text", x, y, text:t, color});
            draw();
        }
    }

    if(tool==="sticky"){
        objects.push({type:"sticky", x, y, text:"Double click to edit", width:150, height:100});
        draw();
    }

    if(tool==="erase"){
        objects = objects.filter(o => !hit(o,x,y));
        draw();
    }

    if(tool==="select"){
        dragging = objects.find(o => hit(o,x,y));
    }
}

function move(e){
    const {x,y} = getMouse(e);

    if(tool==="draw" && isDrawing && dragging){
        dragging.points.push({x,y});
        draw();
    }

    if(tool==="select" && dragging){
        dragging.x = x;
        dragging.y = y;
        draw();
    }
}

function end(){
    isDrawing = false;
    dragging = null;
}

// ================= DOUBLE CLICK EDIT =================
canvas.addEventListener("dblclick", e=>{
    const {x,y} = getMouse(e);
    const obj = objects.find(o => hit(o,x,y) && (o.type==="sticky"||o.type==="text"));
    if(obj){
        const t = prompt("Edit text:", obj.text);
        if(t!==null){
            obj.text = t;
            draw();
        }
    }
});

// ================= HIT TEST =================
function hit(obj,x,y){
    if(obj.type==="path"){
        return obj.points.some(p=>Math.abs(p.x-x)<5 && Math.abs(p.y-y)<5);
    }
    if(obj.type==="text"){
        return x>obj.x && x<obj.x+150 && y>obj.y-20 && y<obj.y+20;
    }
    if(obj.type==="sticky"){
        return x>obj.x && x<obj.x+obj.width && y>obj.y && y<obj.y+obj.height;
    }
}

// ================= DRAW =================
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    objects.forEach(obj=>{
        if(obj.type==="path"){
            ctx.strokeStyle=obj.color;
            ctx.lineWidth=2;
            ctx.beginPath();
            obj.points.forEach((p,i)=> i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
            ctx.stroke();
        }

        if(obj.type==="text"){
            ctx.fillStyle=obj.color;
            ctx.font="16px sans-serif";
            ctx.fillText(obj.text,obj.x,obj.y);
        }

        if(obj.type==="sticky"){
            ctx.fillStyle="#fff176";
            ctx.fillRect(obj.x,obj.y,obj.width,obj.height);
            ctx.fillStyle="#000";
            ctx.fillText(obj.text,obj.x+10,obj.y+25);
        }
    });
}