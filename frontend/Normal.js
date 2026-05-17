const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let img = new Image();

let ROWS = 96, COLS = 144;
let grids = {};

let start = null, end = null, path = [];

let currentFloor = 0;
let fadeAlpha = 1;
let navIndex = 0;
let autoFollow = true;

const floorConfig = {
  0: {
    image: "Ground-Floor-Plan-Final-01.png",
    json: "http://localhost:8080/api/maps/0"
  },
  1: {
    image: "First-Floor-Plan-Final.png",
    json: "http://localhost:8080/api/maps/1"
  },
  2: {
    image: "Second-Floor-Plan-Final.png",
    json: "http://localhost:8080/api/maps/2"
  }
};

function resizeCanvas() {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const c = document.querySelector(".canvas-container");
  const dpr = window.devicePixelRatio || 1;

  const imageRatio = img.naturalWidth / img.naturalHeight;

  let displayWidth = c.clientWidth;
  let displayHeight = displayWidth / imageRatio;

  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayHeight + "px";

  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function emptyGrid() {
  return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

async function preload() {
  for (let f in floorConfig) {
    let res = await fetch(floorConfig[f].json);
    let data = await res.json();

    let g = emptyGrid();

    data.forEach(c => {
      g[c.row][c.col] = c.type;
    });

    grids[f] = g;
  }
}

function changeFloor(f, manual=false) {
  if (manual) autoFollow = false;

  fadeAlpha = 0;

  let fade = setInterval(() => {
    fadeAlpha += 0.05;

    if (fadeAlpha >= 1) {
      fadeAlpha = 1;
      clearInterval(fade);
    }
  }, 20);

  currentFloor = f;
  img.src = floorConfig[f].image;

  document.querySelectorAll(".floor-controls button").forEach(btn => {
    btn.classList.remove("active-floor");
  });

  document.querySelectorAll(".floor-controls button")[f].classList.add("active-floor");
}

canvas.onclick = e => {
  const r = canvas.getBoundingClientRect();

  let col = Math.floor((e.clientX - r.left) / (r.width / COLS));
  let row = Math.floor((e.clientY - r.top) / (r.height / ROWS));

  if (!grids[currentFloor][row]) return;
  if (grids[currentFloor][row][col] === 1) return;

  if (!start) {
    start = {row, col, floor: currentFloor};
  }
  else if (!end) {
    end = {row, col, floor: currentFloor};
    findPath();
  }
  else {
    start = {row, col, floor: currentFloor};
    end = null;
    path = [];
  }
};

function findPath() {
  let q = [start];
  let visited = new Set();
  let parent = {};

  visited.add(`${start.floor},${start.row},${start.col}`);

  let dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (q.length) {
    let c = q.shift();

    if (c.row === end.row && c.col === end.col && c.floor === end.floor) {
      build(parent, c);
      return;
    }

    for (let d of dirs) {
      let nr = c.row + d[0];
      let nc = c.col + d[1];
      let nf = c.floor;

      let key = `${nf},${nr},${nc}`;

      if (
        nr >= 0 &&
        nc >= 0 &&
        nr < ROWS &&
        nc < COLS &&
        grids[nf][nr][nc] !== 1 &&
        !visited.has(key)
      ) {
        visited.add(key);
        parent[key] = c;
        q.push({row: nr, col: nc, floor: nf});
      }
    }

    if (grids[c.floor][c.row][c.col] === 3) {
      [c.floor + 1, c.floor - 1].forEach(f => {
        if (grids[f]) {
          let key = `${f},${c.row},${c.col}`;

          if (!visited.has(key)) {
            visited.add(key);
            parent[key] = c;
            q.push({row: c.row, col: c.col, floor: f});
          }
        }
      });
    }
  }

  alert("No Path Found");
}

function build(parent, node) {
  path = [];

  while (node) {
    path.push(node);
    node = parent[`${node.floor},${node.row},${node.col}`];
  }

  path.reverse();
  startNavigation();
}

function startNavigation() {
  navIndex = 0;
  autoFollow = true;

  function step() {
    if (navIndex >= path.length) return;

    let curr = path[navIndex];
    let prev = path[navIndex - 1];

    if (autoFollow) {
      if (prev && curr.floor !== prev.floor) {
        changeFloor(curr.floor, false);
        navIndex++;
        setTimeout(step, 900);
        return;
      }

      if (curr.floor !== currentFloor) {
        changeFloor(curr.floor, false);
      }
    }

    navIndex++;
    setTimeout(step, 1200);
  }

  step();
}

function resetNavigation() {
  start = null;
  end = null;
  path = [];
  navIndex = 0;
  autoFollow = true;
}

function getTransitions() {
  let t = [];

  for (let i = 1; i < path.length; i++) {
    if (path[i].floor !== path[i - 1].floor) {
      t.push({
        from: path[i - 1],
        to: path[i]
      });
    }
  }

  return t;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let dpr = window.devicePixelRatio || 1;

  ctx.globalAlpha = fadeAlpha;

  ctx.drawImage(
    img,
    0,
    0,
    canvas.width / dpr,
    canvas.height / dpr
  );

  ctx.globalAlpha = 1;

  let w = (canvas.width / dpr) / COLS;
  let h = (canvas.height / dpr) / ROWS;

  ctx.beginPath();
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 4;

  path.forEach((p, i) => {
    if (p.floor !== currentFloor) return;

    let x = p.col * w + w / 2;
    let y = p.row * h + h / 2;

    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();

  if (path[navIndex]) {
    let p = path[navIndex];

    if (p.floor === currentFloor) {
      let x = p.col * w + w / 2;
      let y = p.row * h + h / 2;

      ctx.fillStyle = "cyan";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let blink = Math.floor(Date.now() / 400) % 2;

  ctx.font = "18px Arial";
  ctx.textAlign = "center";

  getTransitions().forEach(t => {
    if (!blink) return;

    if (t.from.floor === currentFloor) {
      let x = t.from.col * w + w / 2;
      let y = t.from.row * h + h / 2;

      ctx.fillStyle = "purple";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.fillText("⬆", x, y + 5);
    }

    if (t.to.floor === currentFloor) {
      let x = t.to.col * w + w / 2;
      let y = t.to.row * h + h / 2;

      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.fillText("⬇", x, y + 5);
    }
  });

  if (start && start.floor === currentFloor) {
    let x = start.col * w + w / 2;
    let y = start.row * h + h / 2;

    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (end && end.floor === currentFloor) {
    let x = end.col * w + w / 2;
    let y = end.row * h + h / 2;

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

img.onload = () => {
  resizeCanvas();
};

window.onresize = resizeCanvas;

(async () => {
  await preload();
  changeFloor(0);
  loop();
})();