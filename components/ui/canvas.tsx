interface Config {
  phase?: number;
  offset?: number;
  frequency?: number;
  amplitude?: number;
}

interface LineConfig {
  spring: number;
}

interface NodeType {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Pos {
  x: number;
  y: number;
}

let ctx: CanvasRenderingContext2D;
let f: Wave;
let pos: Pos = { x: 0, y: 0 };
let lines: Line[] = [];
let e = 0;

const E = {
  debug: true,
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

class Wave {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;

  constructor(e: Config = {}) {
    this.phase = e.phase || 0;
    this.offset = e.offset || 0;
    this.frequency = e.frequency || 0.001;
    this.amplitude = e.amplitude || 1;
  }

  update(): number {
    this.phase += this.frequency;
    return this.offset + Math.sin(this.phase) * this.amplitude;
  }

  value(): number {
    return this.offset + Math.sin(this.phase) * this.amplitude;
  }
}

class Node {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
}

class Line {
  spring: number;
  friction: number;
  nodes: Node[];

  constructor(e: LineConfig) {
    this.spring = e.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];

    for (let i = 0; i < E.size; i++) {
      const node = new Node();
      node.x = pos.x;
      node.y = pos.y;
      this.nodes.push(node);
    }
  }

  update() {
    let spring = this.spring;
    let t = this.nodes[0];
    t.vx += (pos.x - t.x) * spring;
    t.vy += (pos.y - t.y) * spring;

    for (let i = 0; i < this.nodes.length; i++) {
      t = this.nodes[i];
      if (i > 0) {
        const prev = this.nodes[i - 1];
        t.vx += (prev.x - t.x) * spring;
        t.vy += (prev.y - t.y) * spring;
        t.vx += prev.vx * E.dampening;
        t.vy += prev.vy * E.dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x += t.vx;
      t.y += t.vy;
      spring *= E.tension;
    }
  }

  draw() {
    let e, t;
    let n = this.nodes[0].x;
    let i = this.nodes[0].y;

    ctx.beginPath();
    ctx.moveTo(n, i);

    for (let a = 1; a < this.nodes.length - 2; a++) {
      e = this.nodes[a];
      t = this.nodes[a + 1];
      n = 0.5 * (e.x + t.x);
      i = 0.5 * (e.y + t.y);
      ctx.quadraticCurveTo(e.x, e.y, n, i);
    }

    e = this.nodes[this.nodes.length - 2];
    t = this.nodes[this.nodes.length - 1];
    ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
    ctx.stroke();
    ctx.closePath();
  }
}

function onMousemove(event: MouseEvent | TouchEvent) {
  function createLines() {
    lines = [];
    for (let i = 0; i < E.trails; i++) {
      lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
    }
  }

  function moveHandler(e: MouseEvent | TouchEvent) {
    if ('touches' in e && e.touches.length > 0) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    } else if ('clientX' in e) {
      pos.x = e.clientX;
      pos.y = e.clientY;
    }
    e.preventDefault();
  }

  function touchStartHandler(e: TouchEvent) {
    if (e.touches.length === 1) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    }
  }

  document.removeEventListener("mousemove", onMousemove);
  document.removeEventListener("touchstart", onMousemove);
  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("touchmove", moveHandler);
  document.addEventListener("touchstart", touchStartHandler);
  moveHandler(event);
  createLines();
  render();
}

function render() {
  if ((ctx as any).running) {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `hsla(${Math.round(f.update())},100%,50%,0.025)`;
    ctx.lineWidth = 10;

    for (let t = 0; t < E.trails; t++) {
      const line = lines[t];
      line.update();
      line.draw();
    }

    (ctx as any).frame++;
    requestAnimationFrame(render);
  }
}

function resizeCanvas() {
  ctx.canvas.width = window.innerWidth - 20;
  ctx.canvas.height = window.innerHeight;
}

export const renderCanvas = () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d")!;
  (ctx as any).running = true;
  (ctx as any).frame = 1;

  f = new Wave({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });

  document.addEventListener("mousemove", onMousemove);
  document.addEventListener("touchstart", onMousemove);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("focus", () => {
    if (!(ctx as any).running) {
      (ctx as any).running = true;
      render();
    }
  });

  window.addEventListener("blur", () => {
    (ctx as any).running = false;
  });

  resizeCanvas();
};
