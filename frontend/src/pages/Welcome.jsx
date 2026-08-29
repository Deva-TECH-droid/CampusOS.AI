import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Faithful port of the ANIO ASCII-logo hover animation (same physics
// constants, same img-based brightness sampling via getBoundingClientRect)
// — only difference from the original is this runs inside a React
// component with proper effect cleanup instead of loose <script> globals.
//
// To swap in your own logo later: replace
// /public/welcome/campusos-logo.png with your image (same filename, or
// update the src below) — everything else keeps working unchanged.

let CELL_SIZE = 8;
let CELL_GAP = 2;
let CELL_STEP = CELL_SIZE + CELL_GAP;
const GRID_COLOR = "#171717";
const CHAR_COLOR = "#dadada";
const ASCII_CHARS = ".:+#%@0369";
const THRESHOLD = 0.5;
const PUSH_RADIUS = 5;
const PUSH_FORCE = 30;
const SPRING = 0.025;
const DAMPING = 0.5;

const Welcome = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const logoImg = logoImgRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const dpr = window.devicePixelRatio || 1;

    let cols, rows, cells = [];
    let animationFrame;
    let charInterval;

    function setupCanvas() {
      CELL_SIZE = window.innerWidth < 768 ? 3 : 8;
      CELL_GAP = window.innerWidth < 768 ? 1 : 2;
      CELL_STEP = CELL_SIZE + CELL_GAP;
      cols = Math.floor(window.innerWidth / CELL_STEP);
      rows = Math.floor(window.innerHeight / CELL_STEP);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawGrid() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = GRID_COLOR;
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++)
          ctx.fillRect(col * CELL_STEP, row * CELL_STEP, CELL_SIZE, CELL_SIZE);
    }

    function sampleLogoIntoCells() {
      const rect = logoImg.getBoundingClientRect();
      const logoCols = Math.ceil(rect.width / CELL_STEP);
      const logoRows = Math.ceil(rect.height / CELL_STEP);
      const startCol = Math.floor(rect.left / CELL_STEP);
      const startRow = Math.floor(rect.top / CELL_STEP);

      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = logoCols;
      sampleCanvas.height = logoRows;
      const sampleCtx = sampleCanvas.getContext("2d");
      sampleCtx.fillStyle = "#000";
      sampleCtx.fillRect(0, 0, logoCols, logoRows);
      sampleCtx.drawImage(logoImg, 0, 0, logoCols, logoRows);
      const { data } = sampleCtx.getImageData(0, 0, logoCols, logoRows);

      cells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const inLogo =
            col >= startCol &&
            col < startCol + logoCols &&
            row >= startRow &&
            row < startRow + logoRows;
          let isLit = false,
            char = " ";
          if (inLogo) {
            const idx = ((row - startRow) * logoCols + (col - startCol)) * 4;
            const brightness =
              (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
            isLit = brightness > THRESHOLD;
            char = isLit
              ? ASCII_CHARS[Math.min(ASCII_CHARS.length - 1, Math.floor(brightness * ASCII_CHARS.length))]
              : " ";
          }
          cells.push({ col, row, char, isLit, offsetX: 0, offsetY: 0, velX: 0, velY: 0 });
        }
      }
    }

    function renderFrame() {
      ctx.font = `${CELL_SIZE + 2}px monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.fillStyle = GRID_COLOR;
      for (const { col, row } of cells) ctx.fillRect(col * CELL_STEP, row * CELL_STEP, CELL_SIZE, CELL_SIZE);

      ctx.fillStyle = CHAR_COLOR;
      for (const { col, row, char, isLit, offsetX, offsetY } of cells) {
        if (!isLit) continue;
        const x = (col + Math.round(offsetX)) * CELL_STEP;
        const y = (row + Math.round(offsetY)) * CELL_STEP;
        ctx.fillText(char, x + CELL_SIZE / 2, y);
      }
    }

    function init() {
      setupCanvas();
      drawGrid();
      sampleLogoIntoCells();
      renderFrame();
    }

    const mouse = { col: -999, row: -999, isMoving: false };
    let idleTimer = null;

    function updatePhysics() {
      for (const cell of cells) {
        if (!cell.isLit) continue;

        if (mouse.isMoving) {
          const dx = cell.col + cell.offsetX - mouse.col;
          const dy = cell.row + cell.offsetY - mouse.row;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < PUSH_RADIUS && dist > 0) {
            const force = (1 - dist / PUSH_RADIUS) ** 2 * PUSH_FORCE;
            cell.velX += (dx / dist) * force;
            cell.velY += (dy / dist) * force;
          }
        }

        cell.velX += -cell.offsetX * SPRING;
        cell.velY += -cell.offsetY * SPRING;
        cell.velX *= DAMPING;
        cell.velY *= DAMPING;
        cell.offsetX += cell.velX;
        cell.offsetY += cell.velY;
        if (Math.abs(cell.offsetX) < 0.01 && Math.abs(cell.velX) < 0.01) cell.offsetX = cell.velX = 0;
        if (Math.abs(cell.offsetY) < 0.01 && Math.abs(cell.velY) < 0.01) cell.offsetY = cell.velY = 0;
      }
    }

    function animationLoop() {
      updatePhysics();
      renderFrame();
      animationFrame = requestAnimationFrame(animationLoop);
    }

    const handleResize = () => init();
    const handleMouseMove = (e) => {
      mouse.col = e.clientX / CELL_STEP;
      mouse.row = e.clientY / CELL_STEP;
      mouse.isMoving = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        mouse.isMoving = false;
      }, 50);
    };
    const handleMouseLeave = () => {
      mouse.col = mouse.row = -999;
      mouse.isMoving = false;
    };

    setupCanvas();
    drawGrid();
    if (logoImg.complete) init();
    else logoImg.addEventListener("load", init);

    charInterval = setInterval(() => {
      for (const cell of cells) if (cell.isLit) cell.char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
      renderFrame();
    }, 50);
    animationFrame = requestAnimationFrame(animationLoop);

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      logoImg.removeEventListener("load", init);
      clearTimeout(idleTimer);
      clearInterval(charInterval);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="relative w-full h-[100svh] bg-[#0f0f0f] overflow-hidden">
      <canvas ref={canvasRef} className="block absolute inset-0 w-full h-full" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%]">
        <img
          ref={logoImgRef}
          src="/welcome/campusos-logo.png"
          alt=""
          className="w-full h-full object-contain block invisible"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-16 sm:pb-20 pointer-events-none">
        <p className="text-gray-400 text-xs sm:text-sm tracking-wide mb-5 text-center px-6">
          AI-powered campus management — attendance, academics, exams &amp; placements, all in one place.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="pointer-events-auto px-7 py-3 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors shadow-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Welcome;