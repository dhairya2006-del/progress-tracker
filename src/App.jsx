import { useState, useEffect, useRef, useCallback } from "react";

// ─── PARTICLE BACKGROUND ─────────────────────────────────────────────────────
// Replaces the old Spline (WebGL) background. A field of drifting, colored
// dots on a single 2D canvas, with a faint line drawn between dots that are
// close to each other, and dots gently pushed away from the cursor. No
// external library, no network fetch for a remote scene file.
function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Cap device pixel ratio so very high-DPI screens don't force the canvas
    // to render at an unnecessarily large internal resolution.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0, height = 0;
    let particles = [];
    let rafId = null;
    let running = true;
    // Mouse position in CSS pixels, relative to the viewport (matches particle
    // coordinates, which are also in CSS pixels — the dpr scale is applied to
    // the canvas context itself via setTransform, not to these coordinates).
    // null when the cursor isn't over the page / hasn't moved yet.
    const mouse = { x: null, y: null };

    // Roughly one particle per ~2,300px² of screen — triple the previous
    // density — clamped so it stays reasonable on very large or very small
    // screens. At this density the line-drawing pass below uses a spatial
    // grid instead of checking every pair, since a brute-force check across
    // ~400 particles would be ~9x the cost of the previous version per frame.
    const particleCountFor = (w, h) => Math.max(180, Math.min(420, Math.round((w * h) / 2300)));

    const COLORS = [
      "73,144,226",   // blue
      "224,90,90",    // red
      "230,150,60",   // orange
      "100,190,110",  // green
      "224,200,80",   // yellow
      "245,240,232",  // white
      "170,110,210",  // purple
    ];

    const makeParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = particleCountFor(width, height);
      if (particles.length === 0) {
        particles = Array.from({ length: target }, makeParticle);
      } else if (particles.length < target) {
        particles = particles.concat(Array.from({ length: target - particles.length }, makeParticle));
      } else if (particles.length > target) {
        particles = particles.slice(0, target);
      }
    };

    const LINK_DIST = 90;
    // How far the cursor's influence reaches, and how strongly it pushes.
    const REPEL_DIST = 110;
    const REPEL_STRENGTH = 1.6;

    // Spatial grid for the line-drawing pass: bucket particles into cells
    // sized to LINK_DIST, so each particle only ever compares against the
    // handful of particles in its own + 8 neighboring cells instead of every
    // other particle on screen. This keeps the cost roughly proportional to
    // particle count instead of its square, which matters at ~400 particles.
    const buildGrid = () => {
      const grid = new Map();
      const cellSize = LINK_DIST;
      for (let idx = 0; idx < particles.length; idx++) {
        const p = particles[idx];
        const cx = Math.floor(p.x / cellSize);
        const cy = Math.floor(p.y / cellSize);
        const key = cx + "," + cy;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(idx);
      }
      return { grid, cellSize };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Cursor repulsion: if the particle is within REPEL_DIST of the mouse,
        // nudge it directly away, stronger the closer it is. This is added on
        // top of the particle's own drift rather than replacing it, so motion
        // stays smooth instead of snapping.
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_DIST && dist > 0.0001) {
            const force = (1 - dist / REPEL_DIST) * REPEL_STRENGTH;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        // Wrap around the edges instead of bouncing, so motion stays smooth
        // and particles never pile up or vanish off-screen.
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;
      }

      // Faint connecting lines between nearby particles (the "network" look),
      // found via the spatial grid rather than an all-pairs check.
      const { grid, cellSize } = buildGrid();
      ctx.lineWidth = 1;
      const seen = new Set();
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        const cx = Math.floor(p1.x / cellSize);
        const cy = Math.floor(p1.y / cellSize);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const neighbors = grid.get((cx + ox) + "," + (cy + oy));
            if (!neighbors) continue;
            for (const j of neighbors) {
              if (j <= i) continue; // each unordered pair only once
              const pairKey = i + "_" + j;
              if (seen.has(pairKey)) continue;
              seen.add(pairKey);
              const p2 = particles[j];
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < LINK_DIST) {
                ctx.strokeStyle = `rgba(${p1.color},${(1 - dist / LINK_DIST) * 0.18})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = `rgba(${p.color},0.55)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) rafId = requestAnimationFrame(draw);
    };

    // Pause entirely when the tab isn't visible, so it costs nothing while
    // you're in another tab or the window is minimized.
    const handleVisibility = () => {
      running = !document.hidden;
      if (running && rafId === null) {
        rafId = requestAnimationFrame(draw);
      }
    };

    // Tracked on window (not the canvas) since the canvas has pointer-events
    // disabled so clicks pass through to the real UI on top of it — window
    // still receives mousemove regardless of pointer-events on any element.
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    resize();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "#141414" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  profile: {
    name: "Dhairya Joshi",
    degree: "B.Tech 3rd Year · IIT Jodhpur",
    stats: [
      { label: "10th", value: "96.4%" },
      { label: "12th", value: "92.2%" },
      { label: "JEE Main Percentile", value: "99.79" },
      { label: "JEE Main Rank", value: "3,426" },
      { label: "JEE Advanced Rank", value: "8,006" },
      { label: "CGPA", value: "8.43 / 10" },
    ],
    cv: "#",
    about: "I'm a third-year Mechanical Engineering student passionate about building intelligent systems and solving hard algorithmic problems. I believe in learning deeply, building consistently, and staying curious.",
    interests: ["AI & Machine Learning","Quantitative Finance","Data Structures & Algorithms","Mathematics","Physics","Data Analytics","Geopolitics","Research & Projects","Cricket"],
    focus: ["AI & Machine Learning","Deep Learning","Generative AI","Natural Language Processing","Data Structures & Algorithms","AI/ML Projects","Hackathons"],
  },
  dsa: {
    striverLink: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
    topics: [
      { name: "Arrays", easy: 12, medium: 18, hard: 6, revision: 4 },
      { name: "Linked Lists", easy: 8, medium: 10, hard: 3, revision: 2 },
      { name: "Binary Search", easy: 5, medium: 12, hard: 4, revision: 3 },
      { name: "Recursion & Backtracking", easy: 6, medium: 14, hard: 7, revision: 2 },
      { name: "Stacks & Queues", easy: 7, medium: 11, hard: 4, revision: 1 },
      { name: "Trees", easy: 9, medium: 15, hard: 5, revision: 3 },
      { name: "Graphs", easy: 4, medium: 13, hard: 8, revision: 2 },
      { name: "Dynamic Programming", easy: 6, medium: 18, hard: 10, revision: 5 },
      { name: "Heaps", easy: 4, medium: 8, hard: 3, revision: 1 },
      { name: "Tries", easy: 3, medium: 6, hard: 2, revision: 1 },
      { name: "Bit Manipulation", easy: 5, medium: 7, hard: 2, revision: 2 },
      { name: "Greedy Algorithms", easy: 6, medium: 10, hard: 4, revision: 2 },
    ],
  },
  aiml: {
    topics: [
      { name: "Python", subtopics: ["Variables & Data Types","Control Flow","Functions & Lambdas","OOP","File I/O","Virtual Environments","pip & Packages"] },
      { name: "NumPy", subtopics: ["Arrays & Indexing","Broadcasting","Linear Algebra","Random Module","Performance Tips"] },
      { name: "Pandas", subtopics: ["DataFrames & Series","Data Cleaning","GroupBy & Aggregation","Merging & Joining","Time Series"] },
      { name: "Data Visualization", subtopics: ["Matplotlib Basics","Seaborn","Plotly Interactive","Feature Distribution Plots"] },
      { name: "Mathematics", subtopics: ["Linear Algebra","Calculus & Gradients","Probability & Statistics","Information Theory","Optimization Basics"] },
      { name: "ML Fundamentals", subtopics: ["Bias-Variance Tradeoff","Overfitting & Regularization","Feature Engineering","Data Preprocessing","Pipelines"] },
      { name: "Supervised Learning", subtopics: ["Linear Regression","Logistic Regression","Decision Trees","Random Forest","Gradient Boosting","SVM","KNN"] },
      { name: "Unsupervised Learning", subtopics: ["K-Means Clustering","DBSCAN","PCA","Autoencoders","Anomaly Detection"] },
      { name: "Model Evaluation", subtopics: ["Cross-Validation","Confusion Matrix","ROC-AUC","Precision-Recall","Hyperparameter Tuning"] },
      { name: "Deep Learning", subtopics: ["Perceptrons & Neurons","Backpropagation","Activation Functions","Optimizers","Batch Norm & Dropout","CNN Architecture","RNN & LSTM"] },
      { name: "PyTorch", subtopics: ["Tensors & Autograd","nn.Module","DataLoader","Training Loop","Custom Datasets","GPU Acceleration"] },
      { name: "Computer Vision", subtopics: ["Image Preprocessing","CNNs for Vision","Transfer Learning","Object Detection","Segmentation"] },
      { name: "NLP", subtopics: ["Tokenization","Word Embeddings","Seq2Seq","Attention Mechanism","BERT Fine-tuning"] },
      { name: "Transformers", subtopics: ["Self-Attention","Multi-Head Attention","Positional Encoding","Encoder-Decoder","ViT"] },
      { name: "LLMs", subtopics: ["GPT Architecture","Pretraining & Fine-tuning","RLHF","Prompt Engineering","Context Windows"] },
      { name: "Generative AI", subtopics: ["GANs","VAEs","Diffusion Models","Stable Diffusion","DALL-E Concepts"] },
      { name: "AI Agents", subtopics: ["ReAct Framework","Tool Use","Memory Systems","Multi-Agent Systems","LangChain / LlamaIndex"] },
      { name: "SQL", subtopics: ["SELECT & Filtering","JOINs","Aggregations","Window Functions","Query Optimization"] },
      { name: "MLOps", subtopics: ["Experiment Tracking (MLflow)","Model Versioning","CI/CD for ML","Serving with FastAPI","Docker Basics"] },
      { name: "Cloud Basics", subtopics: ["AWS / GCP Overview","S3 & Storage","Compute Instances","Serverless Functions","Cost Management"] },
      { name: "AI Consulting Skills", subtopics: ["Problem Scoping","Stakeholder Communication","ROI Framing","Ethics & Bias","Presentation Skills"] },
      { name: "Projects", subtopics: ["End-to-End ML Pipeline","Deployed Web App","Fine-tuned LLM","Computer Vision App","RAG System"] },
    ],
  },
  currentTopic: {
    name: "Deep Learning",
    videos: Array.from({ length: 84 }, (_, i) => ({ id: i + 1, title: `Lecture ${i + 1}` })),
  },
  academics: {
    semesters: [
      { name: "Semester 5 (Current)", courses: ["CS301 - Algorithms","CS302 - OS","CS303 - DBMS","MA201 - Probability","CS304 - Computer Networks"] },
      { name: "Semester 4", courses: ["CS201 - Data Structures","CS202 - Digital Logic","CS203 - Discrete Math","MA101 - Calculus","CS204 - COA"] },
    ],
  },
  projects: [
    { name: "RAG-based PDF Q&A System", status: "In Progress", progress: 65, tech: ["LangChain","FAISS","FastAPI","Streamlit"], notes: "Building retrieval pipeline; need to add re-ranking." },
    { name: "Custom Neural Network from Scratch", status: "Completed", progress: 100, tech: ["Python","NumPy"], notes: "Implemented backprop, training loop, and visualizations. Blog post pending." },
    { name: "ML Model Deployment Pipeline", status: "Planned", progress: 10, tech: ["Docker","FastAPI","GitHub Actions"], notes: "Automate model versioning and CI/CD deployment." },
    { name: "Algorithmic Trading Backtester", status: "On Hold", progress: 40, tech: ["Python","Pandas","TA-Lib"], notes: "Core backtesting works. Paused for semester exams." },
  ],
  resources: {
    notes: [
      { title: "Transformer Architecture Notes", link: "#", tag: "AI/ML" },
      { title: "Graph Algorithms Cheatsheet", link: "#", tag: "DSA" },
      { title: "DP Patterns & Templates", link: "#", tag: "DSA" },
    ],
    prep: [
      { title: "Striver's A2Z DSA Sheet", link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", tag: "DSA" },
      { title: "Andrej Karpathy's Zero to Hero", link: "https://karpathy.ai/zero-to-hero.html", tag: "DL" },
      { title: "CS229 Machine Learning (Stanford)", link: "https://cs229.stanford.edu/", tag: "ML" },
    ],
    links: [
      { title: "Papers With Code", link: "https://paperswithcode.com", tag: "Research" },
      { title: "Hugging Face Hub", link: "https://huggingface.co", tag: "Models" },
      { title: "Leetcode", link: "https://leetcode.com", tag: "DSA" },
    ],
  },
};

const P = {
  bg: "#141414", text: "#F5F0E8",
  cards: [
    { accent: "#5C9A5C" }, { accent: "#4A9A8A" }, { accent: "#9A6AAA" }, { accent: "#5A90AA" },
    { accent: "#C4A060" }, { accent: "#E8906A" }, { accent: "#5C9A5C" }, { accent: "#C4A060" },
  ],
};

const glass = { background: "rgba(8,8,8,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.10)" };

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s === null ? init : JSON.parse(s); } catch { return init; }
  });
  const set = useCallback((value) => {
    setVal((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  useEffect(() => {
    const fn = (e) => {
      if (e.key !== key) return;
      if (e.newValue === null) { setVal(init); return; }
      try { setVal(JSON.parse(e.newValue)); } catch {}
    };
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, [key]);
  return [val, set];
}

function useInView(threshold = 0.01) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold, rootMargin: "0px 0px -20px 0px" });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(14px)", transition: `opacity 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}s`, willChange: "opacity, transform", ...style }}>
      {children}
    </div>
  );
}

// ─── LOADING SCREEN ──────────────────────────────────────────────────────────
function LoadingScreen({ onDone }) {
  const [pct, setPct] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    let start = null;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const tick = (ts) => {
      if (!start) start = ts;
      const raw = Math.min((ts - start) / 2200, 1);
      setPct(Math.round(ease(raw) * 100));
      if (raw < 1) requestAnimationFrame(tick);
      else setTimeout(() => { setFading(true); setTimeout(onDone, 700); }, 180);
    };
    requestAnimationFrame(tick);
  }, [onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0D0D0D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fading ? 0 : 1, transition: "opacity 0.7s ease", pointerEvents: fading ? "none" : "all" }}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: "clamp(100px,18vw,200px)", fontWeight: 700, color: "#F5F0E8", letterSpacing: "-6px", lineHeight: 1 }}>
        {pct}<span style={{ fontSize: "0.38em", opacity: 0.4 }}>%</span>
      </div>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(245,240,232,0.25)", marginTop: 32 }}>{CONFIG.profile.name} · Portfolio</div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#5C9A5C,#C4A060)", transition: "width 0.08s ease" }} />
      </div>
    </div>
  );
}

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────
function PageHeader({ title, accent, onBack }) {
  return (
    <div style={{ padding: "36px 0 44px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 44 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", padding: 0, display: "flex", alignItems: "center", gap: 8, marginBottom: 22, fontWeight: 500 }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(245,240,232,0.8)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(245,240,232,0.3)"}
      >← Back to home</button>
      <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: "clamp(44px,5vw,70px)", fontWeight: 600, color: "#F5F0E8", margin: 0, letterSpacing: "-1.5px", borderLeft: `4px solid ${accent}`, paddingLeft: 22, lineHeight: 1.1 }}>{title}</h1>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function Card({ children, accent, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ borderRadius: 28, padding: "44px 48px", background: hov ? "rgba(18,18,18,0.95)" : "rgba(10,10,10,0.88)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: `1px solid rgba(255,255,255,0.10)`, borderLeft: `4px solid ${accent}`, boxShadow: hov ? "0 24px 60px rgba(0,0,0,0.8)" : "0 2px 18px rgba(0,0,0,0.6)", transform: hov ? "translateY(-4px)" : "translateY(0)", transition: "box-shadow 0.4s ease,transform 0.4s ease,background 0.3s ease", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ children, accent }) {
  return <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 33, fontWeight: 600, color: "#FFFFFF", marginBottom: 32, letterSpacing: "-0.5px", borderBottom: `2px solid ${accent}`, paddingBottom: 12, display: "inline-block", lineHeight: 1.2 }}>{children}</h2>;
}

// ─── HOVER EXPAND BOX (shared shell) ─────────────────────────────────────────
function HoverBox({ icon, title, subtitle, accent, children, centered = false }) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef(null);
  const onEnter = () => { clearTimeout(leaveTimer.current); setHovered(true); };
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 180); };
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ position: "relative", zIndex: hovered ? 40 : 1 }}>
      <div style={{ display: "flex", flexDirection: centered ? "column" : "row", alignItems: centered ? "center" : "flex-start", textAlign: centered ? "center" : "left", gap: 22, padding: "36px 40px", borderRadius: hovered ? "22px 22px 0 0" : 22, background: hovered ? "rgba(10,10,10,0.92)" : "rgba(10,10,10,0.82)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: centered ? "1px solid rgba(255,255,255,0.07)" : `4px solid ${accent}`, borderTop: centered ? `4px solid ${accent}` : "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)", boxShadow: hovered ? "none" : "0 4px 24px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: hovered ? accent : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: hovered ? "#141414" : accent, transition: "all 0.3s ease", marginTop: centered ? 0 : 2 }}>{icon}</div>
        <div style={{ flex: centered ? "unset" : 1 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 21, fontWeight: 600, color: "#FFFFFF", marginBottom: 7, letterSpacing: "-0.3px", lineHeight: 1.25 }}>{title}</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{subtitle}</div>
        </div>
        {!centered && <div style={{ fontSize: 20, color: accent, opacity: hovered ? 1 : 0, transform: hovered ? "translateX(0)" : "translateX(-8px)", transition: "all 0.3s ease", alignSelf: "center" }}>→</div>}
      </div>
      {/* Absolutely positioned so it floats OVER whatever sits below in the grid/page,
          instead of growing in normal flow and pushing those elements further down the page. */}
      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, overflowX: "hidden", overflowY: hovered ? "auto" : "hidden", maxHeight: hovered ? "70vh" : "0px", opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none", transition: "max-height 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease", background: "rgba(10,10,10,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderLeft: `4px solid ${accent}`, border: hovered ? "1px solid rgba(255,255,255,0.07)" : "none", borderTop: "none", borderRadius: "0 0 22px 22px", boxShadow: hovered ? "0 18px 48px rgba(0,0,0,0.55)" : "none" }}>
        <div style={{ padding: "0 40px 30px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── NOTES BOX ───────────────────────────────────────────────────────────────
function NotesBox() {
  const [notes, setNotes] = useLocalStorage("home-notes", []);
  const accent = "#9A6AAA";
  const addNote = () => setNotes(p => [...p, { id: Date.now(), text: "" }]);
  const updateNote = (id, text) => setNotes(p => p.map(n => n.id === id ? { ...n, text } : n));
  const removeNote = (id) => setNotes(p => p.filter(n => n.id !== id));
  return (
    <HoverBox icon="📝" title="Quick Notes" subtitle={`${notes.length} note${notes.length !== 1 ? "s" : ""} · Hover to expand`} accent={accent}>
      <div style={{ marginTop: 18 }}>
        <button onClick={addNote} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(154,106,170,0.15)", border: "1px solid rgba(154,106,170,0.3)", borderRadius: 10, padding: "8px 16px", fontFamily: "'Poppins',sans-serif", fontSize: 12, color: accent, cursor: "pointer", fontWeight: 600, marginBottom: 14, transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(154,106,170,0.28)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(154,106,170,0.15)"}
        >+ Add Note</button>
        {notes.length === 0 && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.22)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>No notes yet — click Add Note above</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.map(n => (
            <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0, marginTop: 9 }} />
              <textarea
                value={n.text}
                onChange={e => updateNote(n.id, e.target.value)}
                placeholder="Write your note…"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none", resize: "none", lineHeight: 1.6, minHeight: 44, overflow: "hidden" }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              />
              <button onClick={() => removeNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 18, padding: "6px 2px", lineHeight: 1, flexShrink: 0, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#E8906A"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
              >×</button>
            </div>
          ))}
        </div>
      </div>
    </HoverBox>
  );
}

// ─── TASKS BOX ───────────────────────────────────────────────────────────────
function TasksBox() {
  const [tasks, setTasks] = useLocalStorage("home-tasks", []);
  const [input, setInput] = useState("");
  const accent = "#5A90AA";
  const addTask = () => {
    if (!input.trim()) return;
    setTasks(p => [...p, { id: Date.now(), text: input.trim(), done: false }]);
    setInput("");
  };
  const toggleTask = (id) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, done: true } : t));
    setTimeout(() => setTasks(p => p.filter(t => t.id !== id)), 650);
  };
  return (
    <HoverBox icon="✅" title="Tasks" subtitle={`${tasks.length} task${tasks.length !== 1 ? "s" : ""} · Hover to expand`} accent={accent}>
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Add a task…" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 14px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none" }} />
          <button onClick={addTask} style={{ background: accent, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: "#141414", cursor: "pointer" }}>Add</button>
        </div>
        {tasks.length === 0 && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.22)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>No tasks — add one above</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: t.done ? "rgba(92,154,92,0.10)" : "rgba(255,255,255,0.05)", borderRadius: 12, border: t.done ? "1px solid rgba(92,154,92,0.25)" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.4s ease", opacity: t.done ? 0.5 : 1 }}>
              <div onClick={() => toggleTask(t.id)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, background: t.done ? "#5C9A5C" : "transparent", border: `1.5px solid ${t.done ? "#5C9A5C" : "rgba(255,255,255,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.25s" }}>
                {t.done && <span style={{ color: "#141414", fontSize: 10 }}>✓</span>}
              </div>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: t.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", textDecoration: t.done ? "line-through" : "none", flex: 1, lineHeight: 1.5, wordBreak: "break-word", transition: "all 0.3s ease" }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </HoverBox>
  );
}

// ─── DEADLINE BOX ─────────────────────────────────────────────────────────────
function DeadlineBox() {
  const [deadlines, setDeadlines] = useLocalStorage("home-deadlines", []);
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const accent = "#C4A060";
  const addDeadline = () => {
    if (!newTask.trim()) return;
    setDeadlines(p => [...p, { id: Date.now(), task: newTask.trim(), date: newDate }]);
    setNewTask(""); setNewDate("");
  };
  const remove = (id) => setDeadlines(p => p.filter(d => d.id !== id));
  const isOverdue = (ds) => { if (!ds) return false; return new Date(ds + "T00:00:00") < new Date(new Date().toDateString()); };
  const isDueSoon = (ds) => { if (!ds) return false; const diff = (new Date(ds + "T00:00:00") - new Date(new Date().toDateString())) / 86400000; return diff >= 0 && diff <= 3; };
  const upcomingCount = deadlines.filter(d => !isOverdue(d.date)).length;
  return (
    <HoverBox icon="⏰" title="Deadlines" subtitle={`${upcomingCount} upcoming · Hover to expand`} accent={accent}>
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addDeadline()} placeholder="Task name…" style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 14px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none" }} />
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 14px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none", colorScheme: "dark" }} />
          <button onClick={addDeadline} style={{ background: accent, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: "#141414", cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
        </div>
        {deadlines.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 32px", gap: 12, padding: "4px 14px", marginBottom: 8 }}>
            {["Task","Deadline",""].map((h, i) => <span key={i} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</span>)}
          </div>
        )}
        {deadlines.length === 0 && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.22)", textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>No deadlines yet — add one above</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {deadlines.map(d => {
            const ov = isOverdue(d.date), soon = isDueSoon(d.date);
            const rc = ov ? "#E8906A" : soon ? "#C4A060" : "rgba(255,255,255,0.85)";
            return (
              <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 150px 32px", gap: 12, alignItems: "center", background: ov ? "rgba(232,144,106,0.10)" : soon ? "rgba(196,160,96,0.10)" : "rgba(255,255,255,0.05)", borderRadius: 12, padding: "11px 14px", border: ov ? "1px solid rgba(232,144,106,0.25)" : soon ? "1px solid rgba(196,160,96,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: rc, lineHeight: 1.5, wordBreak: "break-word" }}>{d.task}</span>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: ov ? "#E8906A" : soon ? "#C4A060" : "rgba(255,255,255,0.55)", textAlign: "center" }}>
                  {d.date ? new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  {ov && <span style={{ display: "block", fontSize: 10, fontWeight: 400 }}>Overdue</span>}
                  {soon && !ov && <span style={{ display: "block", fontSize: 10, fontWeight: 400 }}>Due soon</span>}
                </span>
                <button onClick={() => remove(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 18, padding: 0, lineHeight: 1, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#E8906A"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                >×</button>
              </div>
            );
          })}
        </div>
      </div>
    </HoverBox>
  );
}

// ─── QUICK LINKS BOX ──────────────────────────────────────────────────────────
function QuickLinksBox() {
  const [links, setLinks] = useLocalStorage("home-quicklinks", []);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const accent = "#4A9A8A";
  const addLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith("http") ? newUrl.trim() : "https://" + newUrl.trim();
    setLinks(p => [...p, { id: Date.now(), label: newLabel.trim(), url }]);
    setNewLabel(""); setNewUrl("");
  };
  const remove = (id) => setLinks(p => p.filter(l => l.id !== id));
  return (
    <HoverBox icon="🔗" title="Quick Links" subtitle={`${links.length} link${links.length !== 1 ? "s" : ""} · Hover to expand`} accent={accent}>
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()} placeholder="Label (e.g. Leetcode)…" style={{ flex: 1, minWidth: 100, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 14px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none" }} />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()} placeholder="URL…" style={{ flex: 2, minWidth: 140, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 14px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none" }} />
          <button onClick={addLink} style={{ background: accent, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: "#141414", cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
        </div>
        {links.length === 0 && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.22)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>No links yet — add one above</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {links.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(74,154,138,0.15)", border: "1px solid rgba(74,154,138,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🔗</div>
              <a href={l.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "#FFFFFF", fontWeight: 500, textDecoration: "none", lineHeight: 1.4 }}
                onMouseEnter={e => e.currentTarget.style.color = accent}
                onMouseLeave={e => e.currentTarget.style.color = "#FFFFFF"}
              >{l.label}</a>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.25)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.url}</span>
              <button onClick={() => remove(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#E8906A"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
              >×</button>
            </div>
          ))}
        </div>
      </div>
    </HoverBox>
  );
}

// ─── DAILY TARGET BOX ────────────────────────────────────────────────────────
function DailyTargetBox() {
  const [calNotes, setCalNotes] = useLocalStorage("calendar-notes", {});
  const [calMarks, setCalMarks] = useLocalStorage("calendar-marks", {});
  const accent = "#5C9A5C";

  // Date picker: default = tomorrow
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(fmt(tomorrow));

  // Parse date to calendar key format: "YYYY-M-D"
  const toCalKey = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${y}-${m - 1}-${d}`;
  };

  const calKey = toCalKey(selectedDate);
  const currentValue = calNotes[calKey] || "";
  const currentMark = calMarks[calKey]; // "tick" | "cross" | undefined

  const updateTarget = (val) => {
    setCalNotes(p => ({ ...p, [calKey]: val }));
  };

  // Same tick → cross → unmark cycle as the Study Calendar's day cells, writing
  // to the exact same "calendar-marks" key — so marking it here is identical to
  // marking that day directly on the calendar.
  const cycleMark = () => {
    setCalMarks(p => {
      const n = { ...p };
      if (!n[calKey]) n[calKey] = "tick";
      else if (n[calKey] === "tick") n[calKey] = "cross";
      else delete n[calKey];
      return n;
    });
  };

  const shiftDate = (dir) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(fmt(d));
  };

  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const isToday = selectedDate === fmt(today);
  const isTomorrow = selectedDate === fmt(tomorrow);
  const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : displayDate;

  const markStyle = currentMark === "tick"
    ? { bg: "rgba(74,154,74,0.18)", border: "rgba(74,154,74,0.45)", color: "#6ABB7A", label: "Done" }
    : currentMark === "cross"
    ? { bg: "rgba(232,144,106,0.18)", border: "rgba(232,144,106,0.45)", color: "#E8906A", label: "Not done" }
    : { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.5)", label: "Unmarked" };

  return (
    <HoverBox icon="🎯" title="Daily Target" subtitle={`Set goals for ${dateLabel} · Saved to calendar`} accent={accent} centered>
      <div style={{ marginTop: 18 }}>
        {/* Date navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Date</span>
          <button onClick={() => shiftDate(-1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          >‹</button>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "7px 12px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none", colorScheme: "dark" }} />
          <button onClick={() => shiftDate(1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          >›</button>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: accent, fontWeight: 600 }}>{dateLabel}</span>

          {/* Tick / cross / unmark toggle — writes straight into calendar-marks
              using the same key + cycle as clicking the day on the Study Calendar. */}
          <button
            onClick={cycleMark}
            title="Click to cycle: unmarked → done → not done → unmarked"
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: markStyle.bg, border: `1.5px solid ${markStyle.border}`, borderRadius: 20, padding: "6px 14px 6px 8px", cursor: "pointer", transition: "all 0.2s ease" }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: currentMark === "tick" ? "#4A7A4A" : currentMark === "cross" ? "#C4714A" : "transparent", border: currentMark === "tick" ? "2px solid #4A7A4A" : currentMark === "cross" ? "2px solid #C4714A" : "1.5px solid rgba(255,255,255,0.3)", color: currentMark ? "#FFF" : "rgba(255,255,255,0.4)" }}>
              {currentMark === "tick" ? "✓" : currentMark === "cross" ? "✗" : "·"}
            </span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: markStyle.color }}>{markStyle.label}</span>
          </button>
        </div>
        <textarea
          value={currentValue}
          onChange={e => updateTarget(e.target.value)}
          placeholder={`Write your goals for ${dateLabel}…\ne.g. ✅ Finish DP lecture 12\n✅ Solve 5 Leetcode problems\n✅ Read 20 pages`}
          maxLength={200}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "14px 16px", fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#FFFFFF", outline: "none", resize: "none", lineHeight: 1.7, minHeight: 110 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Synced to calendar note for {dateLabel}</span>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: currentValue.length > 180 ? "#E8906A" : "rgba(255,255,255,0.25)" }}>{currentValue.length}/200</span>
        </div>
      </div>
    </HoverBox>
  );
}

// ─── HOME NOTIFICATIONS ───────────────────────────────────────────────────────
function HomeNotifications() {
  const [marks] = useLocalStorage("calendar-marks", {});
  const [notes] = useLocalStorage("calendar-notes", {});
  const [deadlines] = useLocalStorage("home-deadlines", []);
  const [dismissed, setDismissed] = useLocalStorage("home-notif-dismissed", {});

  const now = new Date();
  const todayStr = now.toDateString();
  const notifications = [];

  // ── 1. Deadline: due tomorrow ─────────────────────────────────────────────
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  deadlines.forEach(d => {
    if (!d.date) return;
    const due = new Date(d.date + "T00:00:00");
    if (due.toDateString() === tomorrow.toDateString()) {
      const key = `deadline-${d.id}-${todayStr}`;
      if (!dismissed[key]) notifications.push({ key, type: "deadline", icon: "⏰", accent: "#C4A060", bg: "rgba(196,160,96,0.13)", border: "rgba(196,160,96,0.35)", title: "Due Tomorrow", body: d.task, sub: due.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) });
    }
  });

  // ── 2. Streak ≥ 3 days ───────────────────────────────────────────────────
  let streak = 0;
  const d = new Date(now);
  while (true) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (marks[key] === "tick") { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  if (streak >= 3) {
    const key = `streak-${streak}-${todayStr}`;
    if (!dismissed[key]) {
      const msg = streak >= 30 ? `${streak} days — absolutely unstoppable 🔥` : streak >= 14 ? `${streak}-day streak — you're on fire! 🔥` : streak >= 7 ? `${streak}-day streak — incredible consistency! 🔥` : `${streak}-day streak — keep it going! 🔥`;
      notifications.push({ key, type: "streak", icon: "🔥", accent: "#E8906A", bg: "rgba(232,144,106,0.13)", border: "rgba(232,144,106,0.35)", title: "Streak", body: msg, sub: "Check your study calendar" });
    }
  }

  // ── 3. 3 consecutive crosses ─────────────────────────────────────────────
  // Starts the lookback from YESTERDAY, not today. Today is usually still
  // unmarked at the point someone opens the app (the day isn't over yet), so
  // starting from "now" made the loop break immediately and crossStreak was
  // always 0 — the warning could never fire in the situation it's meant for.
  let crossStreak = 0;
  const dc = new Date(now);
  dc.setDate(dc.getDate() - 1);
  for (let i = 0; i < 5; i++) {
    const key = `${dc.getFullYear()}-${dc.getMonth()}-${dc.getDate()}`;
    if (marks[key] === "cross") { crossStreak++; dc.setDate(dc.getDate() - 1); } else break;
  }
  if (crossStreak >= 3) {
    const key = `cross-${todayStr}`;
    if (!dismissed[key]) notifications.push({ key, type: "cross", icon: "😟", accent: "#9A6AAA", bg: "rgba(154,106,170,0.13)", border: "rgba(154,106,170,0.35)", title: "What are you upto these days?", body: `You've missed ${crossStreak} days in a row. Get back on track!`, sub: "You've got this — even 30 mins counts." });
  }

  // ── 4. Weekly summary (show on Sunday or Monday morning) ─────────────────
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  if (dayOfWeek === 0 || dayOfWeek === 1) {
    // Keyed by week number (not todayStr) so dismissing it on Sunday also
    // suppresses it on Monday — otherwise the same weekly summary popped up
    // twice, once each day, since todayStr is different on each.
    const weekNum = Math.floor(now.getTime() / (7 * 86400000));
    const weekKey = `weekly-${weekNum}`;
    if (!dismissed[weekKey]) {
      // Collect last 7 days
      const weekNotes = [];
      let tickCount = 0, crossCount = 0;
      for (let i = 1; i <= 7; i++) {
        const dd = new Date(now); dd.setDate(now.getDate() - i);
        const mk = `${dd.getFullYear()}-${dd.getMonth()}-${dd.getDate()}`;
        if (marks[mk] === "tick") tickCount++;
        if (marks[mk] === "cross") crossCount++;
        const note = notes[mk];
        if (note && note.trim()) weekNotes.push(note.trim().slice(0, 60));
      }
      const eff = Math.round((tickCount / 7) * 100);
      const effLabel = eff >= 80 ? "Excellent" : eff >= 60 ? "Good" : eff >= 40 ? "Okay" : "Needs improvement";
      const notesSummary = weekNotes.length > 0 ? weekNotes.slice(0, 2).join(" · ") : "No notes written this week.";
      notifications.push({ key: weekKey, type: "weekly", icon: "📊", accent: "#5A90AA", bg: "rgba(90,144,170,0.13)", border: "rgba(90,144,170,0.35)", title: "What did you do this week?", body: `${tickCount}/7 days studied · ${effLabel} (${eff}%)`, sub: notesSummary });
    }
  }

  const dismiss = (key) => setDismissed(p => ({ ...p, [key]: true }));

  if (notifications.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
      {notifications.map((n, i) => (
        <div key={n.key} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: n.bg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${n.border}`, borderLeft: `4px solid ${n.accent}`, borderRadius: 16, padding: "16px 20px", animation: `slideInNotif 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s both`, boxShadow: "0 6px 28px rgba(0,0,0,0.4)" }}>
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{n.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 700, color: n.accent, letterSpacing: "0.5px", marginBottom: 3 }}>{n.title}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "#FFFFFF", fontWeight: 500, lineHeight: 1.45, marginBottom: 4 }}>{n.body}</div>
            {n.sub && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{n.sub}</div>}
          </div>
          <button onClick={() => dismiss(n.key)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: 16, flexShrink: 0, transition: "all 0.2s", lineHeight: 1, fontFamily: "'Poppins',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,100,74,0.25)"; e.currentTarget.style.color = "#E8906A"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
// idx is fixed per item (used for its accent color elsewhere, e.g. inside each page),
// independent of where it's displayed in the home page order below.
const NAV_ITEMS = [
  { id: "profile",       label: "My Profile",       sub: "About · Stats · Interests",    icon: "◉", idx: 0 },
  { id: "dsa",           label: "DSA Progress",      sub: "474 problems · 12 topics",     icon: "⌘", idx: 1 },
  { id: "ai-ml",         label: "AI / ML Roadmap",   sub: "22 topics · Subtopic tracker", icon: "◈", idx: 2 },
  { id: "current-topic", label: "Current Topic",     sub: "Deep Learning · 84 videos",    icon: "▶", idx: 3 },
  { id: "calendar",      label: "Study Calendar",    sub: "Jun 2026 – Apr 2027",          icon: "◻", idx: 4 },
  { id: "academics",     label: "Academics",         sub: "Semesters · Courses",          icon: "◆", idx: 5 },
  { id: "projects",      label: "Personal Projects", sub: "4 projects · Progress tracker",icon: "◎", idx: 6 },
  { id: "resources",     label: "Saved Resources",   sub: "Notes · Prep · Links",        icon: "◇", idx: 7 },
];
const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map(n => [n.id, n]));

// ─── HOME ─────────────────────────────────────────────────────────────────────
function Home({ navigate }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 60); }, []);

  // Home page order, top to bottom:
  // 1. Daily Target — full width
  // 2. Quick Links | Deadlines
  // 3. Study Calendar | Tasks
  // 4. AI/ML Roadmap | Current Topic
  // 5. DSA Progress | Academics
  // 6. Personal Projects | Saved Resources
  // 7. Quick Notes — full width
  // 8. My Profile — full width

  return (
    <div>
      {/* Hero */}
      <div style={{ minHeight: "56vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 72, paddingTop: 88 }}>
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)", transition: "all 1s ease 0.1s" }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#5C9A5C", background: "rgba(92,154,92,0.12)", border: "1px solid rgba(92,154,92,0.22)", padding: "5px 14px", borderRadius: 20, display: "inline-block", marginBottom: 26, fontWeight: 500 }}>Progressing · 2025–26</span>
        </div>
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(28px)", transition: "all 1s ease 0.2s" }}>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: "clamp(64px,7.5vw,110px)", fontWeight: 600, color: "#F5F0E8", margin: 0, lineHeight: 1.0, letterSpacing: "-3px" }}>{CONFIG.profile.name}</h1>
        </div>
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)", transition: "all 1s ease 0.32s" }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, color: "rgba(245,240,232,0.75)", margin: "14px 0 0", fontWeight: 400 }}>{CONFIG.profile.degree}</p>
        </div>
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(16px)", transition: "all 1s ease 0.44s", marginTop: 30 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 19, color: "rgba(245,240,232,0.55)", margin: 0, lineHeight: 1.7, fontStyle: "italic", fontWeight: 400 }}>"Building intelligent systems, one commit at a time."</p>
        </div>
        <div style={{ opacity: vis ? 1 : 0, transition: "opacity 1s ease 0.9s", marginTop: 52, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom,transparent,rgba(245,240,232,0.2))" }} />
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: "rgba(245,240,232,0.50)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 400 }}>Select a section below</span>
        </div>
      </div>

      <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)", marginBottom: 32 }} />

      {/* Notifications */}
      <HomeNotifications />

      {/* 1. Daily Target — full width */}
      <div style={{ position: "relative", zIndex: 60 }}>
        <Reveal delay={0}><DailyTargetBox /></Reveal>
      </div>

      <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)", margin: "28px 0" }} />

      {/* 2. Quick Links | Deadlines */}
      <div style={{ position: "relative", zIndex: 55, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Reveal delay={0.04}><QuickLinksBox /></Reveal>
        <Reveal delay={0.08}><DeadlineBox /></Reveal>
      </div>

      {/* 3. Study Calendar | Tasks */}
      <div style={{ position: "relative", zIndex: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Reveal delay={0.12}><NavCard item={NAV_BY_ID.calendar} color={P.cards[NAV_BY_ID.calendar.idx]} navigate={navigate} /></Reveal>
        <Reveal delay={0.16}><TasksBox /></Reveal>
      </div>

      {/* 4. AI/ML Roadmap | Current Topic */}
      <div style={{ position: "relative", zIndex: 45, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Reveal delay={0.20}><NavCard item={NAV_BY_ID["ai-ml"]} color={P.cards[NAV_BY_ID["ai-ml"].idx]} navigate={navigate} /></Reveal>
        <Reveal delay={0.24}><NavCard item={NAV_BY_ID["current-topic"]} color={P.cards[NAV_BY_ID["current-topic"].idx]} navigate={navigate} /></Reveal>
      </div>

      {/* 5. DSA Progress | Academics */}
      <div style={{ position: "relative", zIndex: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Reveal delay={0.28}><NavCard item={NAV_BY_ID.dsa} color={P.cards[NAV_BY_ID.dsa.idx]} navigate={navigate} /></Reveal>
        <Reveal delay={0.32}><NavCard item={NAV_BY_ID.academics} color={P.cards[NAV_BY_ID.academics.idx]} navigate={navigate} /></Reveal>
      </div>

      {/* 6. Personal Projects | Saved Resources */}
      <div style={{ position: "relative", zIndex: 35, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Reveal delay={0.36}><NavCard item={NAV_BY_ID.projects} color={P.cards[NAV_BY_ID.projects.idx]} navigate={navigate} /></Reveal>
        <Reveal delay={0.40}><NavCard item={NAV_BY_ID.resources} color={P.cards[NAV_BY_ID.resources.idx]} navigate={navigate} /></Reveal>
      </div>

      <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)", margin: "28px 0" }} />

      {/* 7. Quick Notes — full width */}
      <div style={{ position: "relative", zIndex: 30 }}>
        <Reveal delay={0.44}><NotesBox /></Reveal>
      </div>

      <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)", margin: "28px 0" }} />

      {/* 8. My Profile — full width */}
      <Reveal delay={0.48}><NavCard item={NAV_BY_ID.profile} color={P.cards[NAV_BY_ID.profile.idx]} navigate={navigate} /></Reveal>

      <div style={{ height: 88 }} />
    </div>
  );
}

function NavCard({ item, color, navigate }) {
  return (
    <>
      <style>{`
        .nav-card { width:100%;text-align:left;background:rgba(10,10,10,0.82);border:1px solid rgba(255,255,255,0.09);border-left:4px solid var(--accent);border-radius:22px;padding:36px 40px;cursor:pointer;display:flex;align-items:flex-start;gap:22px;position:relative;transition:all 0.35s cubic-bezier(0.22,1,0.36,1);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);font-family:'Poppins',sans-serif; }
        .nav-card:hover { background:rgba(22,22,22,0.95);border-color:rgba(255,255,255,0.14);border-left-color:var(--accent);box-shadow:0 20px 56px rgba(0,0,0,0.75);transform:translateY(-5px) scale(1.008); }
        .nav-card-icon { width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--accent);transition:all 0.35s ease;flex-shrink:0;margin-top:2px; }
        .nav-card:hover .nav-card-icon { background:var(--accent);color:#141414; }
        .nav-card-title { font-size:21px;font-weight:600;color:#FFFFFF;line-height:1.25;margin-bottom:7px;letter-spacing:-0.3px; }
        .nav-card-sub { font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;font-weight:400; }
        .nav-card-arrow { font-size:20px;color:var(--accent);opacity:0;transform:translateX(-8px);transition:all 0.3s ease;align-self:center; }
        .nav-card:hover .nav-card-arrow { opacity:1;transform:translateX(0); }
      `}</style>
      <button onClick={() => navigate(item.id)} style={{ "--accent": color.accent }} className="nav-card">
        <div className="nav-card-icon">{item.icon}</div>
        <div style={{ flex: 1 }}>
          <div className="nav-card-title">{item.label}</div>
          <div className="nav-card-sub">{item.sub}</div>
        </div>
        <div className="nav-card-arrow">→</div>
      </button>
    </>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ onBack }) {
  const { profile } = CONFIG;
  const color = P.cards[0];
  return (
    <div>
      <PageHeader title="My Profile" accent={color.accent} onBack={onBack} />
      <div style={{ display: "grid", gap: 26 }}>
        <Reveal>
          <Card accent={color.accent}>
            <CardTitle accent={color.accent}>About Me</CardTitle>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16, color: "rgba(245,240,232,0.75)", lineHeight: 1.85, margin: "0 0 22px", fontWeight: 400 }}>{profile.about}</p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "rgba(245,240,232,0.45)", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>Focus: {profile.focus.join(" · ")}</p>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <Card accent={P.cards[1].accent}>
            <CardTitle accent={P.cards[1].accent}>Academic Stats</CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
              {profile.stats.map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "20px 22px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: "rgba(245,240,232,0.40)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 29, fontWeight: 700, color: "#F5F0E8", letterSpacing: "-0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.12}>
          <Card accent={P.cards[2].accent}>
            <CardTitle accent={P.cards[2].accent}>Interests</CardTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 11 }}>
              {profile.interests.map(i => (
                <span key={i} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, background: `${P.cards[2].accent}18`, color: P.cards[2].accent, padding: "9px 20px", borderRadius: 24, fontWeight: 500, border: `1px solid ${P.cards[2].accent}35` }}>{i}</span>
              ))}
            </div>
            <div style={{ marginTop: 26 }}>
              <a href={profile.cv} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F0E8", color: "#141414", padding: "11px 26px", borderRadius: 11, fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>↓ Download CV</a>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

// ─── DSA PAGE ─────────────────────────────────────────────────────────────────
const EMH_STATES = ["Pending","Visited","Revised"];
const REV_STATES = ["Pending","Done"];
const STATUS_STYLE = {
  Pending:  { bg: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.3)", border: "rgba(255,255,255,0.08)" },
  Visited:  { bg: "rgba(184,118,42,0.15)",  color: "#C4A060", border: "rgba(184,118,42,0.35)" },
  Revised:  { bg: "rgba(74,154,74,0.15)",   color: "#6ABB7A", border: "rgba(74,154,74,0.35)" },
  Done:     { bg: "rgba(74,90,154,0.15)",   color: "#8AAAE8", border: "rgba(74,90,154,0.35)" },
};

function StatusBox({ states, value, onChange }) {
  const s = STATUS_STYLE[value] || STATUS_STYLE.Pending;
  return (
    <button onClick={e => { e.stopPropagation(); const idx = states.indexOf(value); onChange(states[(idx + 1) % states.length]); }} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "3px 10px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.18s ease", lineHeight: 1.6 }}>{value}</button>
  );
}

function DSAPage({ onBack }) {
  const [statuses, setStatuses] = useLocalStorage("dsa-statuses", {});
  const setStatus = (topic, field, val) => setStatuses(p => ({ ...p, [`${topic}::${field}`]: val }));
  const getStatus = (topic, field, states) => statuses[`${topic}::${field}`] || states[0];
  const color = P.cards[1];
  return (
    <div>
      <PageHeader title="DSA Progress" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card accent={color.accent}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 34 }}>
            <CardTitle accent={color.accent}>Problem Tracker</CardTitle>
            <a href={CONFIG.dsa.striverLink} target="_blank" rel="noreferrer" style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: color.accent, textDecoration: "none", fontWeight: 600, borderBottom: `1px solid ${color.accent}`, paddingBottom: 2 }}>Striver's Sheet ↗</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {CONFIG.dsa.topics.map(t => (
              <div key={t.name} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 15, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: "#F5F0E8", minWidth: 220 }}>{t.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {[{label:"Easy",field:"easy",states:EMH_STATES,c:"#6ABB7A"},{label:"Medium",field:"medium",states:EMH_STATES,c:"#C4A060"},{label:"Hard",field:"hard",states:EMH_STATES,c:"#C88080"},{label:"Rev",field:"revision",states:REV_STATES,c:"#9090D8"}].map(({ label, field, states, c }) => (
                      <div key={field} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: c, fontWeight: 600, minWidth: 30, textAlign: "right" }}>{label}</span>
                        <StatusBox states={states} value={getStatus(t.name, field, states)} onChange={val => setStatus(t.name, field, val)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

// ─── AI/ML PAGE ───────────────────────────────────────────────────────────────
function AIMLPage({ onBack }) {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [progress, setProgress] = useLocalStorage("aiml-progress", {});
  const containerRef = useRef(null);
  const toggle = (name) => setExpandedTopic(prev => prev === name ? null : name);
  const toggleSub = (topic, sub) => setProgress(p => ({ ...p, [`${topic}::${sub}`]: !p[`${topic}::${sub}`] }));
  const getTP = (t) => { const done = t.subtopics.filter(s => progress[`${t.name}::${s}`]).length; return { done, total: t.subtopics.length, pct: Math.round((done / t.subtopics.length) * 100) }; };
  useEffect(() => {
    const fn = (e) => { if (expandedTopic && containerRef.current && !containerRef.current.contains(e.target)) setExpandedTopic(null); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [expandedTopic]);
  const color = P.cards[2];
  return (
    <div>
      <PageHeader title="AI / ML Roadmap" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card accent={color.accent}>
          <CardTitle accent={color.accent}>Topic Progress</CardTitle>
          <div ref={containerRef} style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, alignItems: "start" }}>
            {CONFIG.aiml.topics.map(t => {
              const { done, total, pct } = getTP(t);
              const isOpen = expandedTopic === t.name;
              return (
                <div key={t.name} style={{ position: "relative", overflow: "visible", zIndex: isOpen ? 50 : 1 }}>
                  <button onClick={() => toggle(t.name)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", padding: "16px 20px", textAlign: "left", borderRadius: 15 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: "#FFFFFF" }}>{t.name}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: pct === 100 ? color.accent : "rgba(245,240,232,0.55)", fontWeight: pct === 100 ? 700 : 400 }}>{done}/{total}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.10)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#5C9A5C" : color.accent, borderRadius: 4, transition: "width 0.5s ease" }} />
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0, zIndex: 999, padding: "0 20px 16px", borderRadius: 16, background: "rgba(14,14,20,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
                      {t.subtopics.map(s => {
                        const isDone = progress[`${t.name}::${s}`];
                        return (
                          <label key={s} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 0", cursor: "pointer" }}>
                            <div onClick={() => toggleSub(t.name, s)} style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, background: isDone ? color.accent : "transparent", border: `1.5px solid ${isDone ? color.accent : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                              {isDone && <span style={{ color: "#141414", fontSize: 10 }}>✓</span>}
                            </div>
                            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: isDone ? "rgba(245,240,232,0.3)" : "rgba(245,240,232,0.85)", textDecoration: isDone ? "line-through" : "none", fontWeight: 400 }}>{s}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

// ─── CURRENT TOPIC PAGE ───────────────────────────────────────────────────────
// NOTE: notes are owned by CurrentTopicPage in ONE useLocalStorage call and passed
// down as (note, onChange) props. Each LectureNote used to call its own
// useLocalStorage("lecture-notes", {}) — with 84 instances mounted at once, every
// instance held its own stale snapshot of the shared object, so saving a note on
// one lecture silently wiped out notes already saved on the others. Lifting the
// state up fixes that, since there is now exactly one source of truth.
function LectureNote({ videoId, note, onChange, accent, onHoverChange }) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef(null);
  const setHover = (v) => { setHovered(v); onHoverChange?.(v); };
  const onEnter = () => { clearTimeout(leaveTimer.current); setHover(true); };
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHover(false), 200); };
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ position: "relative", zIndex: hovered ? 100 : "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, cursor: "pointer" }}>
        <span style={{ fontSize: 10, color: note ? accent : "rgba(255,255,255,0.2)" }}>📝</span>
        <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, color: note ? accent : "rgba(255,255,255,0.2)", fontWeight: note ? 600 : 400 }}>{note ? "Note" : "Add note"}</span>
      </div>
      {hovered && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 999, width: 220, background: "rgba(12,12,18,0.97)", border: `1px solid rgba(255,255,255,0.12)`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: "10px 12px", boxShadow: "0 16px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: accent, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Lecture Note</div>
          <textarea
            autoFocus
            value={note}
            onChange={e => onChange(e.target.value)}
            placeholder="Write a short note about this lecture…"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px", fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#FFFFFF", outline: "none", resize: "none", lineHeight: 1.55, minHeight: 70 }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
          />
        </div>
      )}
    </div>
  );
}

function CurrentTopicPage({ onBack }) {
  const [checked, setChecked] = useLocalStorage("dl-videos", {});
  const [lectureNotes, setLectureNotes] = useLocalStorage("lecture-notes", {});
  const [openNoteId, setOpenNoteId] = useState(null);
  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const updateNote = (id, val) => setLectureNotes(p => ({ ...p, [id]: val }));
  const { currentTopic } = CONFIG;
  const doneCount = currentTopic.videos.filter(v => checked[v.id]).length;
  const pct = Math.round((doneCount / currentTopic.videos.length) * 100);
  const color = P.cards[3];
  return (
    <div>
      <PageHeader title="Current Topic" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card accent={color.accent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18, marginBottom: 10 }}>
            <div>
              <CardTitle accent={color.accent}>{currentTopic.name}</CardTitle>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.45)", marginTop: -26, marginBottom: 22, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 500 }}>84 Video Lectures · Now Studying</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 18, padding: "18px 32px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 40, fontWeight: 700, color: "#F5F0E8", letterSpacing: "-1.5px" }}>{pct}%</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(245,240,232,0.45)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 500 }}>{doneCount}/{currentTopic.videos.length} done</div>
            </div>
          </div>
          <div style={{ height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 6, marginBottom: 30, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color.accent, borderRadius: 6, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
            {currentTopic.videos.map(v => {
              const done = checked[v.id];
              // The card itself gets the elevated z-index while its own note is open, so the
              // popup is guaranteed to paint above cards in the row below (siblings without an
              // explicit z-index stack purely by DOM order, so a child's z-index alone can't
              // win against a later sibling row).
              const noteOpen = openNoteId === v.id;
              return (
                <div key={v.id} style={{ background: done ? `${color.accent}18` : "rgba(255,255,255,0.04)", borderRadius: 11, padding: "11px 13px", border: done ? `1.5px solid ${color.accent}40` : "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s", position: "relative", zIndex: noteOpen ? 50 : 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <div onClick={() => toggle(v.id)} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1, background: done ? color.accent : "transparent", border: `1.5px solid ${done ? color.accent : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}>
                      {done && <span style={{ color: "#141414", fontSize: 9 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: "rgba(245,240,232,0.25)", marginBottom: 2 }}>#{v.id}</div>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: done ? "rgba(245,240,232,0.3)" : "rgba(245,240,232,0.8)", textDecoration: done ? "line-through" : "none", lineHeight: 1.45 }}>{v.title}</div>
                    </div>
                  </div>
                  <LectureNote
                    videoId={v.id}
                    accent={color.accent}
                    note={lectureNotes[v.id] || ""}
                    onChange={val => updateNote(v.id, val)}
                    onHoverChange={isHovering => setOpenNoteId(isHovering ? v.id : null)}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────
function CalendarPage({ onBack }) {
  const [marks, setMarks] = useLocalStorage("calendar-marks", {});
  const [notes, setNotes] = useLocalStorage("calendar-notes", {});
  const [chartVisible, setChartVisible] = useState(false);
  const [visiblePastCount, setVisiblePastCount] = useState(0);
  const chartRef = useRef(null);
  const sentinelRef = useRef(null);
  const toggleDay = (key) => setMarks(p => { const n = { ...p }; if (!n[key]) n[key] = "tick"; else if (n[key] === "tick") n[key] = "cross"; else delete n[key]; return n; });
  const setNote = (key, val) => setNotes(p => ({ ...p, [key]: val }));
  const color = P.cards[4];
  const now = new Date();
  const currentYear = now.getFullYear(), currentMonth = now.getMonth();
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthNamesShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const allMonths = [];
  for (let m = 5; m <= 11; m++) allMonths.push({ year: 2026, month: m });
  for (let m = 0; m <= 3; m++) allMonths.push({ year: 2027, month: m });
  const pastMonths = allMonths.filter(({ year, month }) => year < currentYear || (year === currentYear && month < currentMonth)).reverse();
  const getEff = (y, m) => { const days = getDaysInMonth(y, m); let t = 0; for (let d = 1; d <= days; d++) if (marks[`${y}-${m}-${d}`] === "tick") t++; return days > 0 ? Math.round((t / days) * 100) : 0; };
  const getStreak = () => { let s = 0; const d = new Date(now); while (true) { const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; if (marks[k] === "tick") { s++; d.setDate(d.getDate() - 1); } else break; } return s; };
  const getBestStreak = () => { let best = 0, cur = 0; for (const { year, month } of allMonths) { const days = getDaysInMonth(year, month); for (let d = 1; d <= days; d++) { if (marks[`${year}-${month}-${d}`] === "tick") { cur++; best = Math.max(best, cur); } else cur = 0; } } return best; };
  const getBestMonth = () => { let best = { label: "—", pct: 0 }; for (const { year, month } of allMonths) { const p = getEff(year, month); if (p > best.pct) best = { label: `${monthNamesShort[month]} ${year}`, pct: p }; } return best; };
  const chartMonths = [...pastMonths].reverse().slice(-5);
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setChartVisible(true); }, { threshold: 0.2 }); if (chartRef.current) obs.observe(chartRef.current); return () => obs.disconnect(); }, []);
  useEffect(() => { if (!pastMonths.length) return; const s = sentinelRef.current; if (!s) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisiblePastCount(p => Math.min(p + 1, pastMonths.length)); }, { threshold: 0.1, rootMargin: "200px" }); obs.observe(s); return () => obs.disconnect(); }, [pastMonths.length]);

  const renderMonth = (year, month, opts = {}) => {
    const { isPast = false } = opts;
    const days = getDaysInMonth(year, month), firstDay = getFirstDay(year, month), eff = getEff(year, month);
    const tickCount = Object.keys(marks).filter(k => { const [ky, km] = k.split("-").map(Number); return ky === year && km === month && marks[k] === "tick"; }).length;
    return (
      <div key={`${year}-${month}`} style={{ ...glass, borderRadius: 22, padding: "32px 36px", marginBottom: 28, background: isPast ? "rgba(8,8,8,0.82)" : "rgba(10,10,10,0.88)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: isPast ? 22 : 26, fontWeight: 600, color: isPast ? "rgba(255,255,255,0.75)" : "#FFFFFF", letterSpacing: "-0.5px" }}>{monthNames[month]} {year}</span>
            {isPast && <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px" }}>Past</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{tickCount}/{days} studied</span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: eff >= 70 ? "#6ABB7A" : eff >= 40 ? color.accent : "#E8906A", background: eff >= 70 ? "rgba(74,154,74,0.15)" : eff >= 40 ? `${color.accent}18` : "rgba(232,144,106,0.15)", padding: "4px 14px", borderRadius: 20, border: `1px solid ${eff >= 70 ? "rgba(74,154,74,0.3)" : eff >= 40 ? `${color.accent}35` : "rgba(232,144,106,0.3)"}` }}>{eff}% efficient</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 6 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", textAlign: "center", paddingBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} style={{ minHeight: 96 }} />)}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1, key = `${year}-${month}-${day}`, mark = marks[key], noteVal = notes[key] || "";
            const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
            const isFuture = new Date(year, month, day) > now;
            let cellBg = "rgba(255,255,255,0.08)", cellBorder = "1px solid rgba(255,255,255,0.14)";
            if (mark === "tick") { cellBg = "rgba(74,154,74,0.18)"; cellBorder = "1.5px solid rgba(74,154,74,0.45)"; }
            else if (mark === "cross") { cellBg = "rgba(232,144,106,0.18)"; cellBorder = "1.5px solid rgba(232,144,106,0.45)"; }
            else if (isToday) { cellBg = "rgba(255,255,255,0.18)"; cellBorder = "2px solid rgba(255,255,255,0.55)"; }
            const numColor = mark === "tick" ? "#6ABB7A" : mark === "cross" ? "#E8906A" : isToday ? "#FFFFFF" : "rgba(255,255,255,0.80)";
            return (
              <div key={day} style={{ minHeight: 96, borderRadius: 10, background: cellBg, border: cellBorder, display: "flex", flexDirection: "column", padding: "9px 10px", opacity: isFuture ? 0.25 : 1, transition: "background 0.15s,border 0.15s", cursor: !isFuture ? "pointer" : "default" }} onClick={() => !isFuture && toggleDay(key)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: mark ? 700 : isToday ? 600 : 400, color: numColor, lineHeight: 1, userSelect: "none" }}>{day}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", fontSize: 11, fontWeight: 700, flexShrink: 0, userSelect: "none", background: mark === "tick" ? "#4A7A4A" : mark === "cross" ? "#C4714A" : "transparent", border: mark === "tick" ? "2px solid #4A7A4A" : mark === "cross" ? "2px solid #C4714A" : "1.5px solid rgba(255,255,255,0.25)", color: mark ? "#FFF" : "rgba(255,255,255,0.3)" }}>{mark === "tick" ? "✓" : mark === "cross" ? "✗" : "·"}</span>
                </div>
                {!isFuture && <textarea rows={3} maxLength={200} placeholder="note…" value={noteVal} onChange={e => setNote(key, e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.70)", lineHeight: 1.4, cursor: "text", padding: 0, marginTop: 2, flex: 1 }} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const streak = getStreak(), bestStreak = getBestStreak(), bestMonth = getBestMonth();
  const chartData = chartMonths.map(({ year, month }) => ({ label: monthNamesShort[month], pct: getEff(year, month) }));
  const maxPct = Math.max(...chartData.map(d => d.pct), 1);

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <PageHeader title="Study Calendar" accent={color.accent} onBack={onBack} />
      <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.40)", marginBottom: 32, textAlign: "center" }}>Click a day: unmarked → ✓ studied → ✗ missed → clear · Click the note area to write (up to 200 chars)</p>
      <Reveal>{renderMonth(currentYear, currentMonth)}</Reveal>
      <Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 28 }}>
          {[{ label: "Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, icon: "🔥", highlight: streak >= 3 },{ label: "Best Streak", value: `${bestStreak} day${bestStreak !== 1 ? "s" : ""}`, icon: "🏆", highlight: false },{ label: "Best Month", value: bestMonth.pct > 0 ? `${bestMonth.label} • ${bestMonth.pct}%` : "No data yet", icon: "⭐", highlight: false }].map(s => (
            <div key={s.label} style={{ ...glass, borderRadius: 18, padding: "24px 26px", background: s.highlight ? `${color.accent}12` : "rgba(10,10,10,0.85)", border: s.highlight ? `1.5px solid ${color.accent}40` : "1px solid rgba(255,255,255,0.12)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 700, color: s.highlight ? color.accent : "#F5F0E8", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Reveal>
      {chartData.length > 0 && (
        <Reveal>
          <div ref={chartRef} style={{ ...glass, borderRadius: 22, padding: "32px 36px 28px", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 600, color: "#F5F0E8", marginBottom: 4 }}>Performance Analysis</h2>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.40)", marginBottom: 36 }}>Efficiency across the last {chartData.length} completed month{chartData.length !== 1 ? "s" : ""}</p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 24, height: 180 }}>
              {chartData.map((d, i) => { const barH = chartVisible ? Math.max(Math.round((d.pct / maxPct) * 140), d.pct > 0 ? 6 : 0) : 0; const alpha = 0.40 + (d.pct / 100) * 0.60; return (
                <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, maxWidth: 100 }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: color.accent, opacity: chartVisible ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.1 + 0.3}s`, minHeight: 20 }}>{d.pct}%</span>
                  <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", height: 140 }}>
                    <div style={{ width: "100%", height: barH, background: `rgba(196,160,96,${alpha})`, borderRadius: "8px 8px 0 0", transition: `height 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s,opacity 0.4s ease ${i * 0.1}s`, opacity: chartVisible ? 1 : 0 }} />
                  </div>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{d.label}</span>
                </div>
              ); })}
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginTop: 4 }} />
          </div>
        </Reveal>
      )}
      {pastMonths.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500 }}>Past months</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>
      )}
      {pastMonths.slice(0, visiblePastCount).map(({ year, month }) => renderMonth(year, month, { isPast: true }))}
      {visiblePastCount < pastMonths.length && <div ref={sentinelRef} style={{ height: 1, marginBottom: 28 }} />}
      <div style={{ height: 88 }} />
    </div>
  );
}

// ─── ACADEMICS PAGE ───────────────────────────────────────────────────────────
function AcademicsPage({ onBack }) {
  const color = P.cards[5];
  const currentSem = CONFIG.academics.semesters[0];
  const credits = { "CS301 - Algorithms": 4, "CS302 - OS": 4, "CS303 - DBMS": 4, "MA201 - Probability": 3, "CS304 - Computer Networks": 4 };
  return (
    <div>
      <PageHeader title="Academics" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card accent={color.accent}>
          <CardTitle accent={color.accent}>Current Semester Courses</CardTitle>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "24px 26px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 19, fontWeight: 600, color: "#F5F0E8", margin: "0 0 18px" }}>{currentSem.name}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12, padding: "0 14px", marginBottom: 10 }}>
              {["Course","Credits"].map(h => <div key={h} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,240,232,0.40)", textAlign: h === "Credits" ? "right" : "left" }}>{h}</div>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentSem.courses.map(c => (
                <div key={c} style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12, alignItems: "center", padding: "13px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 12, borderLeft: `3px solid ${color.accent}` }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(245,240,232,0.75)" }}>{c}</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#F5F0E8", fontWeight: 600, textAlign: "right" }}>{credits[c] ?? "-"}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

// ─── PROJECTS PAGE ────────────────────────────────────────────────────────────
const STATUS_COLORS_PROJ = { "Completed": { bg: "rgba(74,154,74,0.18)", text: "#6ABB7A" }, "In Progress": { bg: "rgba(74,90,154,0.18)", text: "#8AAAE8" }, "Planned": { bg: "rgba(196,160,96,0.18)", text: "#C4A060" }, "On Hold": { bg: "rgba(232,144,106,0.18)", text: "#E8906A" } };

function ProjectsPage({ onBack }) {
  const color = P.cards[6];
  return (
    <div>
      <PageHeader title="Personal Projects" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card accent={color.accent}>
          <CardTitle accent={color.accent}>Project Board</CardTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
            {CONFIG.projects.map(p => {
              const sc = STATUS_COLORS_PROJ[p.status] || STATUS_COLORS_PROJ["Planned"];
              return (
                <div key={p.name} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "24px 26px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 17, fontWeight: 600, color: "#F5F0E8", margin: 0, lineHeight: 1.35, maxWidth: "68%" }}>{p.name}</h3>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, background: sc.bg, color: sc.text, padding: "3px 11px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>{p.status}</span>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(245,240,232,0.45)" }}>Progress</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "rgba(245,240,232,0.75)" }}>{p.progress}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.10)", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.progress}%`, background: color.accent, borderRadius: 5 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
                    {p.tech.map(t => <span key={t} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, background: "rgba(255,255,255,0.07)", color: "rgba(245,240,232,0.60)", padding: "3px 9px", borderRadius: 12, fontWeight: 500 }}>{t}</span>)}
                  </div>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.50)", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>{p.notes}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────────
function ResourcesPage({ onBack }) {
  const { resources } = CONFIG;
  const color = P.cards[7];
  const tagColors = { "AI/ML": "#7AAAC8", "DSA": "#6ABB7A", "DL": "#A880C8", "ML": "#C4A060", "Research": "#C88080", "Models": "#9090D8" };
  const tagBgs = { "AI/ML": "rgba(74,112,136,0.18)", "DSA": "rgba(74,154,74,0.18)", "DL": "rgba(122,92,136,0.18)", "ML": "rgba(196,160,96,0.18)", "Research": "rgba(200,128,128,0.18)", "Models": "rgba(144,144,216,0.18)" };
  const ResourceGroup = ({ title, items, i }) => (
    <Reveal delay={i * 0.07}>
      <Card accent={color.accent}>
        <CardTitle accent={color.accent}>{title}</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map(item => (
            <a key={item.title} href={item.link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", background: "rgba(255,255,255,0.04)", borderRadius: 13, textDecoration: "none", border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "rgba(245,240,232,0.85)", fontWeight: 500 }}>{item.title}</span>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, background: tagBgs[item.tag] || "rgba(255,255,255,0.08)", color: tagColors[item.tag] || "rgba(245,240,232,0.5)", padding: "3px 11px", borderRadius: 20, fontWeight: 600 }}>{item.tag}</span>
            </a>
          ))}
        </div>
      </Card>
    </Reveal>
  );
  return (
    <div>
      <PageHeader title="Saved Resources" accent={color.accent} onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 26 }}>
        <ResourceGroup title="Personal Notes" items={resources.notes} i={0} />
        <ResourceGroup title="Prep Materials" items={resources.prep} i={1} />
        <div style={{ gridColumn: "1 / -1" }}><ResourceGroup title="Useful Links" items={resources.links} i={2} /></div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("home");
  const navigate = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pageMap = {
    home: <Home navigate={navigate} />,
    profile: <ProfilePage onBack={() => navigate("home")} />,
    dsa: <DSAPage onBack={() => navigate("home")} />,
    "ai-ml": <AIMLPage onBack={() => navigate("home")} />,
    "current-topic": <CurrentTopicPage onBack={() => navigate("home")} />,
    calendar: <CalendarPage onBack={() => navigate("home")} />,
    academics: <AcademicsPage onBack={() => navigate("home")} />,
    projects: <ProjectsPage onBack={() => navigate("home")} />,
    resources: <ResourcesPage onBack={() => navigate("home")} />,
  };
  return (
    <>
      <ParticleBackground />
      <div style={{ background: "transparent", minHeight: "100vh", width: "100%", boxSizing: "border-box", position: "relative", zIndex: 1 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
          *{box-sizing:border-box;margin:0;padding:0;}
          html,body{width:100%;max-width:100%;overflow-x:hidden;background:#141414;}
          #root,[data-reactroot]{width:100%;}
          ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:3px;}
          button,a{font-family:'Poppins',sans-serif;}
          textarea::placeholder,input::placeholder{color:rgba(245,240,232,0.22);font-style:italic;}
          textarea:focus{color:rgba(245,240,232,0.85);}
          @media(max-width:920px){.two-col{grid-template-columns:1fr!important;}}
          @keyframes slideInNotif{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}
        `}</style>
        {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
        <div style={{ width: "100%", padding: "0 28px 96px", opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease 0.2s", boxSizing: "border-box" }}>
          {page !== "home" && (
            <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(6,6,6,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", padding: "15px 0", marginBottom: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 600, color: "#F5F0E8", letterSpacing: "-0.5px" }}>{CONFIG.profile.name}</button>
                <div style={{ display: "flex", gap: 4 }}>
                  {NAV_ITEMS.map(item => (
                    <button key={item.id} onClick={() => navigate(item.id)} style={{ background: page === item.id ? "rgba(255,255,255,0.09)" : "none", border: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontSize: 12, color: page === item.id ? "#F5F0E8" : "rgba(245,240,232,0.35)", padding: "5px 12px", borderRadius: 8, fontWeight: page === item.id ? 600 : 400, transition: "all 0.2s" }}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {pageMap[page] || pageMap.home}
        </div>
      </div>
    </>
  );
}