const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let objects = [];
let tool = "select";
let color = "#000000";

let dragging = null;
let isDrawing = false;
let isErasing = false;

let eraserRadius = 20;
let eraserCursor = null;

let camera = { x:0, y:0, zoom:1 };

document.querySelectorAll("[data-tool]").forEach(btn=>{
    btn.onclick = () => {
        document.querySelectorAll("[data-tool]").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        tool = btn.dataset.tool;
        if(tool !== "erase"){
            eraserCursor = null;
            draw();
        }
    };
});

document.getElementById("colorPicker").oninput = e => color = e.target.value;
document.getElementById("eraserSize").oninput = e => eraserRadius = parseInt(e.target.value);

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

canvas.addEventListener("pointerdown", start);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", end);
canvas.addEventListener("pointerleave", () => { eraserCursor = null; draw(); });
canvas.addEventListener("wheel", zoomCanvas);

canvas.addEventListener("dblclick", e=>{
    const {x,y} = getMouse(e);
    const obj = objects.find(o => hit(o,x,y) && (o.type==="sticky"||o.type==="text"));
    if(obj){
        const t = prompt("Edit text:", obj.text);
        if(t!==null){ obj.text = t; draw(); }
    }
});

function getMouse(e){
    return { x: (e.offsetX-camera.x)/camera.zoom, y: (e.offsetY-camera.y)/camera.zoom };
}

function start(e){
    const {x,y} = getMouse(e);
    if(tool==="draw"){
        isDrawing=true;
        const path={type:"path", points:[{x,y}], color};
        objects.push(path);
        dragging=path;
    }
    if(tool==="erase"){ isErasing=true; eraseAt(x,y); }
    if(tool==="text"){ const t=prompt("Enter text:"); if(t) objects.push({type:"text",x,y,text:t,color}); draw(); }
    if(tool==="sticky"){ objects.push({type:"sticky",x,y,text:"Double click to edit",width:150,height:100}); draw(); }
    if(tool==="select"){ dragging = objects.find(o => hit(o,x,y)); }
}

function move(e){
    const {x,y} = getMouse(e);
    if(tool==="draw" && isDrawing && dragging){ dragging.points.push({x,y}); draw(); }
    if(tool==="erase"){ eraserCursor={x,y}; if(isErasing) eraseAt(x,y); draw(); }
    if(tool==="select" && dragging){ dragging.x=x; dragging.y=y; draw(); }
}

function end(){ isDrawing=false; isErasing=false; dragging=null; }

function eraseAt(x,y){
    let newObjects=[];
    objects.forEach(obj=>{
        if(obj.type!=="path"){ newObjects.push(obj); return; }
        let segments=[], current=[];
        obj.points.forEach(p=>{
            const dx=p.x-x, dy=p.y-y;
            const dist=Math.sqrt(dx*dx+dy*dy);
            if(dist>eraserRadius) current.push(p);
            else { if(current.length>1) segments.push({type:"path",points:[...current],color:obj.color}); current=[]; }
        });
        if(current.length>1) segments.push({type:"path",points:[...current],color:obj.color});
        newObjects.push(...segments);
    });
    objects=newObjects;
    draw();
}

function zoomCanvas(e){
    e.preventDefault();
    const zoomAmount=-e.deltaY*0.001;
    const newZoom=camera.zoom+zoomAmount;
    if(newZoom<0.3||newZoom>4) return;
    const mouseX=e.offsetX, mouseY=e.offsetY;
    camera.x-=(mouseX-camera.x)*zoomAmount;
    camera.y-=(mouseY-camera.y)*zoomAmount;
    camera.zoom=newZoom;
    draw();
}

function hit(obj,x,y){
    if(obj.type==="path") return obj.points.some(p=>Math.abs(p.x-x)<5 && Math.abs(p.y-y)<5);
    if(obj.type==="text") return x>obj.x && x<obj.x+150 && y>obj.y-20 && y<obj.y+20;
    if(obj.type==="sticky") return x>obj.x && x<obj.x+obj.width && y>obj.y && y<obj.y+obj.height;
}

function draw(){
    ctx.setTransform(camera.zoom,0,0,camera.zoom,camera.x,camera.y);
    ctx.clearRect(-camera.x/camera.zoom,-camera.y/camera.zoom,canvas.width/camera.zoom,canvas.height/camera.zoom);

    objects.forEach(obj=>{
        if(obj.type==="path"){ ctx.strokeStyle=obj.color; ctx.lineWidth=2; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.beginPath(); obj.points.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke(); }
        if(obj.type==="text"){ ctx.fillStyle=obj.color; ctx.font="16px sans-serif"; ctx.fillText(obj.text,obj.x,obj.y); }
        if(obj.type==="sticky"){ ctx.fillStyle="#fff176"; ctx.fillRect(obj.x,obj.y,obj.width,obj.height); ctx.fillStyle="#000"; ctx.fillText(obj.text,obj.x+10,obj.y+25); }
    });

    if(tool==="erase" && eraserCursor){
        ctx.beginPath();
        ctx.strokeStyle="red";
        ctx.lineWidth=1;
        ctx.arc(eraserCursor.x,eraserCursor.y,eraserRadius,0,Math.PI*2);
        ctx.stroke();
    }
}