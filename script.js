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
let eraserCursor = null;
let camera = { x:0, y:0, zoom:1 };
const PROJECT_KEY = "flavortown_current_project";

const container = document.createElement("div");
container.style.position="absolute";
container.style.top=0;
container.style.left=0;
container.style.pointerEvents="none";
document.body.appendChild(container);

// Tools
document.querySelectorAll("[data-tool]").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll("[data-tool]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    tool = btn.dataset.tool;
    eraserCursor = null;
    draw();
  }
});
document.getElementById("colorPicker").oninput=e=>color=e.target.value;
document.getElementById("eraserSize").oninput=e=>eraserRadius=parseInt(e.target.value);

// Save / Load
document.getElementById("saveBtn").onclick=()=>{ 
  localStorage.setItem(PROJECT_KEY, JSON.stringify(objects));
  alert("Project saved!");
};
document.getElementById("loadBtn").onclick=()=>{ 
  const saved = localStorage.getItem(PROJECT_KEY);
  if(!saved){ alert("No saved project"); return; }
  objects = JSON.parse(saved);
  objects.forEach(obj=>{ if(obj.type==="text"||obj.type==="sticky") createEditableObject(obj); });
  draw();
};

// Canvas events
canvas.addEventListener("pointerdown", start);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", end);
canvas.addEventListener("wheel", zoomCanvas);

function getMouse(e){ return { x:(e.offsetX-camera.x)/camera.zoom, y:(e.offsetY-camera.y)/camera.zoom }; }

function createEditableObject(obj){
  const div = document.createElement("div");
  div.contentEditable = true;
  div.innerText = obj.text||"";
  div.style.position="absolute";
  div.style.left=obj.x*camera.zoom+camera.x+"px";
  div.style.top=obj.y*camera.zoom+camera.y+"px";
  div.style.width=(obj.width||150)*camera.zoom+"px";
  div.style.height=(obj.height||40)*camera.zoom+"px";
  div.style.background = obj.type==="sticky"?"#fff176":"transparent";
  div.style.color=obj.color; div.style.font="16px sans-serif"; div.style.padding="6px";
  div.style.boxSizing="border-box"; div.style.border="2px solid black"; div.style.pointerEvents="auto";
  div.style.resize=obj.type==="sticky"?"both":"none"; div.style.overflow="hidden";
  container.appendChild(div);
  div.focus();

  div.addEventListener("input", ()=>obj.text=div.innerText);
  div.addEventListener("blur", ()=>{
    obj.width = div.offsetWidth/camera.zoom;
    obj.height = div.offsetHeight/camera.zoom;
    div.style.border="none";
  });
  div.addEventListener("focus", ()=>div.style.border="2px solid black");

  let offsetX=0, offsetY=0, dragging=false;
  div.addEventListener("mousedown", e=>{
    dragging=true;
    offsetX = e.clientX - div.getBoundingClientRect().left;
    offsetY = e.clientY - div.getBoundingClientRect().top;
    e.stopPropagation();
  });
  document.addEventListener("mousemove", e=>{
    if(!dragging) return;
    obj.x = (e.clientX-offsetX-camera.x)/camera.zoom;
    obj.y = (e.clientY-offsetY-camera.y)/camera.zoom;
    div.style.left = obj.x*camera.zoom+camera.x+"px";
    div.style.top = obj.y*camera.zoom+camera.y+"px";
  });
  document.addEventListener("mouseup", ()=>dragging=false);
  obj._div=div;
}

function start(e){
  const {x,y}=getMouse(e);
  if(tool==="draw"){ isDrawing=true; const path={type:"path",points:[{x,y}],color}; objects.push(path); draggingPath=path; }
  if(tool==="erase"){ isErasing=true; eraseAt(x,y); }
  if(tool==="text"){ const obj={type:"text",x,y,width:200,height:40,text:"",color}; objects.push(obj); createEditableObject(obj);}
  if(tool==="sticky"){ const obj={type:"sticky",x,y,width:180,height:120,text:"",color}; objects.push(obj); createEditableObject(obj);}
  draw();
}
function move(e){ const {x,y}=getMouse(e);
  if(tool==="draw" && isDrawing && draggingPath){ draggingPath.points.push({x,y}); draw(); }
  if(tool==="erase"){ eraserCursor={x,y}; if(isErasing) eraseAt(x,y); draw(); }
}
function end(){ isDrawing=false; isErasing=false; draggingPath=null; }

function eraseAt(x,y){
  let newObjects=[];
  objects.forEach(obj=>{
    if(obj.type!=="path"){ newObjects.push(obj); return; }
    let segments=[],current=[];
    obj.points.forEach(p=>{
      const dx=p.x-x, dy=p.y-y, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>eraserRadius) current.push(p);
      else { if(current.length>1) segments.push({type:"path",points:[...current],color:obj.color}); current=[]; }
    });
    if(current.length>1) segments.push({type:"path",points:[...current],color:obj.color});
    newObjects.push(...segments);
  });
  objects=newObjects;
}

function zoomCanvas(e){
  e.preventDefault();
  const zoomAmount=-e.deltaY*0.001;
  const newZoom=camera.zoom+zoomAmount;
  if(newZoom<0.3||newZoom>4) return;
  camera.x-=(e.offsetX-camera.x)*zoomAmount;
  camera.y-=(e.offsetY-camera.y)*zoomAmount;
  camera.zoom=newZoom;
  objects.forEach(obj=>{
    if(obj._div){ obj._div.style.left=obj.x*camera.zoom+camera.x+"px"; obj._div.style.top=obj.y*camera.zoom+camera.y+"px"; obj._div.style.width=obj.width*camera.zoom+"px"; obj._div.style.height=obj.height*camera.zoom+"px"; }
  });
  draw();
}

function draw(){
  ctx.setTransform(camera.zoom,0,0,camera.zoom,camera.x,camera.y);
  ctx.clearRect(-camera.x/camera.zoom,-camera.y/camera.zoom,canvas.width/camera.zoom,canvas.height/camera.zoom);
  objects.forEach(obj=>{
    if(obj.type==="path"){ ctx.strokeStyle=obj.color; ctx.lineWidth=2; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.beginPath(); obj.points.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke(); }
  });
  if(tool==="erase" && eraserCursor){ ctx.beginPath(); ctx.strokeStyle="red"; ctx.lineWidth=1; ctx.arc(eraserCursor.x,eraserCursor.y,eraserRadius,0,Math.PI*2); ctx.stroke(); }
}

// Optional: auto-load last project
window.onload = ()=>{
  const saved = localStorage.getItem(PROJECT_KEY);
  if(saved){ objects = JSON.parse(saved); objects.forEach(obj=>{ if(obj.type==="text"||obj.type==="sticky") createEditableObject(obj); }); draw(); }
};