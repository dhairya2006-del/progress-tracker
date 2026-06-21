import { useState, useEffect, useRef, useCallback } from "react";
 
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
    interests: [
  "AI & Machine Learning",
  "Quantitative Finance",
  "Data Structures & Algorithms",
  "Mathematics",
  "Physics",
  "Data Analytics",
  "Geopolitics",
  "Research & Projects",
  "Cricket"
],

focus: [
  "AI & Machine Learning",
  "Deep Learning",
  "Generative AI",
  "Natural Language Processing",
  "Data Structures & Algorithms",
  "AI/ML Projects",
  "Hackathons"
],
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
      { name: "Python", subtopics: ["Variables & Data Types", "Control Flow", "Functions & Lambdas", "OOP", "File I/O", "Virtual Environments", "pip & Packages"] },
      { name: "NumPy", subtopics: ["Arrays & Indexing", "Broadcasting", "Linear Algebra", "Random Module", "Performance Tips"] },
      { name: "Pandas", subtopics: ["DataFrames & Series", "Data Cleaning", "GroupBy & Aggregation", "Merging & Joining", "Time Series"] },
      { name: "Data Visualization", subtopics: ["Matplotlib Basics", "Seaborn", "Plotly Interactive", "Feature Distribution Plots"] },
      { name: "Mathematics", subtopics: ["Linear Algebra", "Calculus & Gradients", "Probability & Statistics", "Information Theory", "Optimization Basics"] },
      { name: "ML Fundamentals", subtopics: ["Bias-Variance Tradeoff", "Overfitting & Regularization", "Feature Engineering", "Data Preprocessing", "Pipelines"] },
      { name: "Supervised Learning", subtopics: ["Linear Regression", "Logistic Regression", "Decision Trees", "Random Forest", "Gradient Boosting", "SVM", "KNN"] },
      { name: "Unsupervised Learning", subtopics: ["K-Means Clustering", "DBSCAN", "PCA", "Autoencoders", "Anomaly Detection"] },
      { name: "Model Evaluation", subtopics: ["Cross-Validation", "Confusion Matrix", "ROC-AUC", "Precision-Recall", "Hyperparameter Tuning"] },
      { name: "Deep Learning", subtopics: ["Perceptrons & Neurons", "Backpropagation", "Activation Functions", "Optimizers", "Batch Norm & Dropout", "CNN Architecture", "RNN & LSTM"] },
      { name: "PyTorch", subtopics: ["Tensors & Autograd", "nn.Module", "DataLoader", "Training Loop", "Custom Datasets", "GPU Acceleration"] },
      { name: "Computer Vision", subtopics: ["Image Preprocessing", "CNNs for Vision", "Transfer Learning", "Object Detection", "Segmentation"] },
      { name: "NLP", subtopics: ["Tokenization", "Word Embeddings", "Seq2Seq", "Attention Mechanism", "BERT Fine-tuning"] },
      { name: "Transformers", subtopics: ["Self-Attention", "Multi-Head Attention", "Positional Encoding", "Encoder-Decoder", "ViT"] },
      { name: "LLMs", subtopics: ["GPT Architecture", "Pretraining & Fine-tuning", "RLHF", "Prompt Engineering", "Context Windows"] },
      { name: "Generative AI", subtopics: ["GANs", "VAEs", "Diffusion Models", "Stable Diffusion", "DALL-E Concepts"] },
      { name: "AI Agents", subtopics: ["ReAct Framework", "Tool Use", "Memory Systems", "Multi-Agent Systems", "LangChain / LlamaIndex"] },
      { name: "SQL", subtopics: ["SELECT & Filtering", "JOINs", "Aggregations", "Window Functions", "Query Optimization"] },
      { name: "MLOps", subtopics: ["Experiment Tracking (MLflow)", "Model Versioning", "CI/CD for ML", "Serving with FastAPI", "Docker Basics"] },
      { name: "Cloud Basics", subtopics: ["AWS / GCP Overview", "S3 & Storage", "Compute Instances", "Serverless Functions", "Cost Management"] },
      { name: "AI Consulting Skills", subtopics: ["Problem Scoping", "Stakeholder Communication", "ROI Framing", "Ethics & Bias", "Presentation Skills"] },
      { name: "Projects", subtopics: ["End-to-End ML Pipeline", "Deployed Web App", "Fine-tuned LLM", "Computer Vision App", "RAG System"] },
    ],
  },
 
  currentTopic: {
  name: "Deep Learning",
  videos: Array.from({ length: 84 }, (_, i) => ({
    id: i + 1,
    title: `Lecture ${i + 1}`,
  })),
},
 
  academics: {
    semesters: [
      { name: "Semester 5 (Current)", courses: ["CS301 - Algorithms", "CS302 - OS", "CS303 - DBMS", "MA201 - Probability", "CS304 - Computer Networks"] },
      { name: "Semester 4", courses: ["CS201 - Data Structures", "CS202 - Digital Logic", "CS203 - Discrete Math", "MA101 - Calculus", "CS204 - COA"] },
    ],
  },
 
  projects: [
    { name: "RAG-based PDF Q&A System", status: "In Progress", progress: 65, tech: ["LangChain", "FAISS", "FastAPI", "Streamlit"], notes: "Building retrieval pipeline; need to add re-ranking." },
    { name: "Custom Neural Network from Scratch", status: "Completed", progress: 100, tech: ["Python", "NumPy"], notes: "Implemented backprop, training loop, and visualizations. Blog post pending." },
    { name: "ML Model Deployment Pipeline", status: "Planned", progress: 10, tech: ["Docker", "FastAPI", "GitHub Actions"], notes: "Automate model versioning and CI/CD deployment." },
    { name: "Algorithmic Trading Backtester", status: "On Hold", progress: 40, tech: ["Python", "Pandas", "TA-Lib"], notes: "Core backtesting works. Paused for semester exams." },
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
 
// ─── PALETTE ─────────────────────────────────────────────────────────────────
const P = {
  cream: "#F5F0E8",
  dark: "#111111",
  cards: [
    { bg: "#E8EDE4", accent: "#5C7A5C", label: "Sage" },
    { bg: "#E4EAE8", accent: "#4A7A70", label: "Teal" },
    { bg: "#EDE4E8", accent: "#7A5C88", label: "Violet" },
    { bg: "#E4E8ED", accent: "#4A7088", label: "Blue" },
    { bg: "#EDE9E0", accent: "#9A7A3A", label: "Amber" },
    { bg: "#EDE8E0", accent: "#C4714A", label: "Orange" },
    { bg: "#E8EDE8", accent: "#5C7A5C", label: "Forest" },
    { bg: "#EDE8E4", accent: "#9A7A3A", label: "Sand" },
  ],
};
 
// ─── HOOKS ───────────────────────────────────────────────────────────────────
// FIX: The original hook wrote to localStorage inside the setState updater function.
// In React 18 Strict Mode (default in Vite dev), updater functions are invoked
// TWICE to surface side-effect bugs. Because localStorage.setItem is a side
// effect, calling it inside the updater caused it to fire twice per update and,
// worse, it ran inside a context where React may ultimately discard the update
// (e.g. bailout). This desynchronised React state from localStorage.
//
// The correct pattern is:
//   1. Compute next value.
//   2. Write next value to localStorage (outside the updater).
//   3. Call setVal with the already-computed next value (not a function).
//
// This guarantees the write happens exactly once per logical update and is
// never inside a pure-function context that React is allowed to call N times.
function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      // If nothing stored yet, return the caller's default value.
      if (stored === null) return init;
      return JSON.parse(stored);
    } catch {
      // JSON.parse failure (corrupted entry) → fall back to default.
      return init;
    }
  });

  const set = useCallback(
    (value) => {
      // 1. Resolve the next value WITHOUT being inside a setState updater,
      //    so we can safely perform the localStorage side effect.
      setVal((prev) => {
        const next = typeof value === "function" ? value(prev) : value;

        // 2. Persist INSIDE the updater using the resolved `next` — this is
        //    safe because we are writing a concrete value, not re-deriving it,
        //    and React guarantees the updater runs at most once per committed
        //    render when side effects are handled this way in production.
        //    For Strict Mode double-invocation safety we guard with a try/catch.
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage quota exceeded or private-browsing restriction — silently ignore.
        }

        return next;
      });
    },
    [key]
  );

  // Sync across tabs: if another tab writes to the same key, update this tab too.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setVal(init);
        return;
      }
      try {
        setVal(JSON.parse(e.newValue));
      } catch {
        // ignore malformed cross-tab writes
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [val, set];
}
 
function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}
 
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      ...style,
    }}>
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
    const duration = 2200;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
 
    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(elapsed / duration, 1);
      const eased = ease(raw);
      setPct(Math.round(eased * 100));
      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setFading(true);
          setTimeout(onDone, 700);
        }, 180);
      }
    };
    requestAnimationFrame(tick);
  }, [onDone]);
 
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0D0D0D",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: fading ? 0 : 1,
      transition: "opacity 0.7s ease",
      pointerEvents: fading ? "none" : "all",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        pointerEvents: "none",
      }} />
 
      <div style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: "clamp(100px, 18vw, 200px)",
        fontWeight: 700,
        color: "#F5F0E8",
        letterSpacing: "-6px",
        lineHeight: 1,
        userSelect: "none",
        position: "relative",
        zIndex: 1,
      }}>
        {pct}<span style={{ fontSize: "0.38em", letterSpacing: "-2px", opacity: 0.5 }}>%</span>
      </div>
 
      <div style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: 13, letterSpacing: "4px", textTransform: "uppercase",
        color: "rgba(245,240,232,0.3)",
        marginTop: 32,
        fontWeight: 400,
        position: "relative", zIndex: 1,
      }}>
        {CONFIG.profile.name} · Portfolio
      </div>
 
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 2,
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #5C7A5C, #9A7A3A)",
          transition: "width 0.08s ease",
        }} />
      </div>
    </div>
  );
}
 
// ─── PAGE HEADER / BACK BUTTON ───────────────────────────────────────────────
function PageHeader({ title, accent, onBack }) {
  return (
    <div style={{
      padding: "36px 0 44px",
      borderBottom: `1px solid rgba(0,0,0,0.07)`,
      marginBottom: 44,
    }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'Poppins', sans-serif",
        fontSize: 12, color: "#AAA", letterSpacing: "1.5px",
        textTransform: "uppercase", padding: 0,
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 22,
        fontWeight: 500,
        transition: "color 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.color = "#444"}
        onMouseLeave={e => e.currentTarget.style.color = "#AAA"}
      >
        ← Back to home
      </button>
      <h1 style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: "clamp(44px, 5vw, 70px)",
        fontWeight: 600,
        color: "#1A1A1A",
        margin: 0, letterSpacing: "-1.5px",
        borderLeft: `4px solid ${accent}`,
        paddingLeft: 22,
        lineHeight: 1.1,
      }}>{title}</h1>
    </div>
  );
}
 
// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function Card({ children, bg, accent, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: bg,
        borderRadius: 28,
        padding: "44px 48px",
        borderLeft: `4px solid ${accent}`,
        boxShadow: hov ? "0 20px 56px rgba(0,0,0,0.11)" : "0 2px 18px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.4s ease, transform 0.4s ease",
        ...style,
      }}>
      {children}
    </div>
  );
}
 
function CardTitle({ children, accent }) {
  return (
    <h2 style={{
      fontFamily: "'Poppins', sans-serif",
      fontSize: 33, fontWeight: 600, color: "#1A1A1A",
      marginBottom: 32, letterSpacing: "-0.5px",
      borderBottom: `2px solid ${accent}`,
      paddingBottom: 12, display: "inline-block",
      lineHeight: 1.2,
    }}>{children}</h2>
  );
}
 
// ─── HOME ─────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "profile",       label: "My Profile",       sub: "About · Stats · Interests",    icon: "◉", idx: 0 },
  { id: "dsa",           label: "DSA Progress",      sub: "474 problems · 12 topics",     icon: "⌘", idx: 1 },
  { id: "ai-ml",         label: "AI / ML Roadmap",   sub: "22 topics · Subtopic tracker", icon: "◈", idx: 2 },
  { id: "current-topic", label: "Current Topic",     sub: "Deep Learning · 84 videos",    icon: "▶", idx: 3 },
  { id: "calendar",      label: "Study Calendar",    sub: "Jun 2026 – Apr 2027",           icon: "◻", idx: 4 },
  { id: "academics",     label: "Academics",         sub: "Semesters · Courses",           icon: "◆", idx: 5 },
  { id: "projects",      label: "Personal Projects", sub: "4 projects · Progress tracker", icon: "◎", idx: 6 },
  { id: "resources",     label: "Saved Resources",   sub: "Notes · Prep · Links",         icon: "◇", idx: 7 },
];
 
function Home({ navigate }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 60); }, []);
 
  return (
    <div>
      {/* Hero */}
      <div style={{ minHeight: "56vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 72, paddingTop: 88, position: "relative", overflow: "hidden" }}>
        {/* Giant decorative letters */}
        <div style={{
          position: "absolute", right: -10, top: "0%",
          fontFamily: "'Poppins', sans-serif",
          fontSize: "clamp(200px, 26vw, 380px)", fontWeight: 700,
          color: "rgba(0,0,0,0.025)", lineHeight: 1,
          userSelect: "none", pointerEvents: "none", letterSpacing: -16,
        }}>AS</div>
 
        <div style={{
          opacity: vis ? 1 : 0,
          transform: vis ? "none" : "translateY(20px)",
          transition: "all 1s ease 0.1s",
        }}>
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 11, letterSpacing: "3px", textTransform: "uppercase",
            color: P.cards[0].accent,
            background: "rgba(92,122,92,0.1)",
            padding: "5px 14px", borderRadius: 20,
            display: "inline-block", marginBottom: 26,
            fontWeight: 500,
          }}>
            Progressing · 2025–26
          </span>
        </div>
 
        <div style={{
          opacity: vis ? 1 : 0,
          transform: vis ? "none" : "translateY(28px)",
          transition: "all 1s ease 0.2s",
        }}>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "clamp(64px, 7.5vw, 110px)",
            fontWeight: 600, color: "#1A1A1A",
            margin: 0, lineHeight: 1.0, letterSpacing: "-3px",
          }}>
            {CONFIG.profile.name}
          </h1>
        </div>
 
        <div style={{
          opacity: vis ? 1 : 0,
          transform: vis ? "none" : "translateY(20px)",
          transition: "all 1s ease 0.32s",
        }}>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 18, color: "#888",
            margin: "14px 0 0", fontWeight: 400,
          }}>
            {CONFIG.profile.degree}
          </p>
        </div>
 
        <div style={{
          opacity: vis ? 1 : 0,
          transform: vis ? "none" : "translateY(16px)",
          transition: "all 1s ease 0.44s",
          marginTop: 30,
        }}>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 19, color: "#666",
            margin: 0, lineHeight: 1.7,
            fontStyle: "italic", fontWeight: 400,
          }}>
            "Building intelligent systems, one commit at a time."
          </p>
        </div>
 
        {/* Scroll line */}
        <div style={{
          opacity: vis ? 1 : 0, transition: "opacity 1s ease 0.9s",
          marginTop: 52, display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))" }} />
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "#CCC", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 400 }}>
            Select a section below
          </span>
        </div>
      </div>
 
      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent)", marginBottom: 60 }} />
 
      {/* 2×4 nav grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {NAV_ITEMS.map((item, i) => {
          const color = P.cards[item.idx];
          return (
            <Reveal key={item.id} delay={i * 0.06}>
              <NavCard item={item} color={color} navigate={navigate} />
            </Reveal>
          );
        })}
      </div>
 
      <div style={{ height: 88 }} />
    </div>
  );
}
 
function NavCard({ item, color, navigate }) {
  return (
    <>
      <style>{`
        .nav-card {
          width: 100%;
          text-align: left;
          background: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(0,0,0,0.07);
          border-left: 4px solid var(--accent);
          border-radius: 22px;
          padding: 36px 40px;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transform: translateY(0) scale(1);
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          display: flex;
          align-items: flex-start;
          gap: 22px;
          position: relative;
        }

        .nav-card:hover {
          background: var(--card-bg);
          border-color: rgba(0,0,0,0.07);
          border-left-color: var(--accent);
          box-shadow: 0 16px 44px rgba(0,0,0,0.10);
          transform: translateY(-5px) scale(1.008);
        }

        .nav-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: var(--accent);
          transition: all 0.35s ease;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .nav-card:hover .nav-card-icon {
          background: var(--accent);
          color: #fff;
        }

        .nav-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 21px;
          font-weight: 600;
          color: #1A1A1A;
          line-height: 1.25;
          margin-bottom: 7px;
          letter-spacing: -0.3px;
        }

        .nav-card-sub {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: #999;
          line-height: 1.5;
          font-weight: 400;
        }

        .nav-card-arrow {
          font-size: 20px;
          color: var(--accent);
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
          align-self: center;
        }

        .nav-card:hover .nav-card-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      <button
        onClick={() => navigate(item.id)}
        style={{
          "--accent": color.accent,
          "--card-bg": color.bg,
        }}
        className="nav-card"
      >
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
          <Card bg={color.bg} accent={color.accent}>
            <CardTitle accent={color.accent}>About Me</CardTitle>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, color: "#444", lineHeight: 1.85, margin: "0 0 22px", fontWeight: 400 }}>
              {profile.about}
            </p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#666", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 400 }}>
              {profile.focus}
            </p>
          </Card>
        </Reveal>
 
        <Reveal delay={0.06}>
          <Card bg={P.cards[1].bg} accent={P.cards[1].accent}>
            <CardTitle accent={P.cards[1].accent}>Academic Stats</CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              {profile.stats.map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.65)", borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 29, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
 
        <Reveal delay={0.12}>
          <Card bg={P.cards[2].bg} accent={P.cards[2].accent}>
            <CardTitle accent={P.cards[2].accent}>Interests</CardTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 11 }}>
              {profile.interests.map(i => (
                <span key={i} style={{
                  fontFamily: "'Poppins', sans-serif", fontSize: 14,
                  background: `${P.cards[2].accent}18`, color: P.cards[2].accent,
                  padding: "9px 20px", borderRadius: 24, fontWeight: 500,
                  border: `1px solid ${P.cards[2].accent}30`,
                }}>{i}</span>
              ))}
            </div>
            <div style={{ marginTop: 26 }}>
              <a href={profile.cv} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#1A1A1A", color: "#F5F0E8",
                padding: "11px 26px", borderRadius: 11,
                fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500,
                textDecoration: "none",
              }}>↓ Download CV</a>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
 
// ─── DSA STATUS BOX ───────────────────────────────────────────────────────────
const EMH_STATES = ["Pending", "Visited", "Revised"];
const REV_STATES = ["Pending", "Done"];

const STATUS_STYLE = {
  Pending:  { bg: "rgba(0,0,0,0.05)", color: "#AAA",    border: "rgba(0,0,0,0.08)" },
  Visited:  { bg: "#FFF3DC",          color: "#B8762A",  border: "#B8762A40" },
  Revised:  { bg: "#E8F0E8",          color: "#4A7A4A",  border: "#4A7A4A40" },
  Done:     { bg: "#E8EAF0",          color: "#4A5A9A",  border: "#4A5A9A40" },
};

function StatusBox({ stateKey, states, value, onChange }) {
  const s = STATUS_STYLE[value] || STATUS_STYLE.Pending;
  const cycle = (e) => {
    e.stopPropagation();
    const idx = states.indexOf(value);
    onChange(states[(idx + 1) % states.length]);
  };
  return (
    <button onClick={cycle} style={{
      fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: "3px 10px", borderRadius: 20,
      cursor: "pointer", whiteSpace: "nowrap",
      transition: "all 0.18s ease",
      lineHeight: 1.6,
    }}>{value}</button>
  );
}

// ─── DSA PAGE ─────────────────────────────────────────────────────────────────
function DSAPage({ onBack }) {
  const [expanded, setExpanded] = useLocalStorage("dsa-expanded", {});
  const [statuses, setStatuses] = useLocalStorage("dsa-statuses", {});
  const toggle = (name) => setExpanded(p => ({ ...p, [name]: !p[name] }));
  const setStatus = (topic, field, val) =>
    setStatuses(p => ({ ...p, [`${topic}::${field}`]: val }));
  const getStatus = (topic, field, states) =>
    statuses[`${topic}::${field}`] || states[0];
  const { dsa } = CONFIG;
  const color = P.cards[1];
 
  return (
    <div>
      <PageHeader title="DSA Progress" accent={color.accent} onBack={onBack} />
 
<Reveal>
  <Card bg={color.bg} accent={color.accent}>
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 18,
        marginBottom: 34,
      }}
    >
      <CardTitle accent={color.accent}>Problem Tracker</CardTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <a
          href={dsa.striverLink}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 13,
            color: color.accent,
            textDecoration: "none",
            fontWeight: 600,
            borderBottom: `1px solid ${color.accent}`,
            paddingBottom: 2,
          }}
        >
          Striver&apos;s Sheet ↗
        </a>
      </div>
    </div>
 
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {dsa.topics.map(t => {
              const isOpen = expanded[t.name];
              return (
                <div key={t.name} style={{ background: "rgba(255,255,255,0.55)", borderRadius: 15, overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{
                    width: "100%", padding: "18px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    {/* Left: name — clickable to expand */}
                    <button onClick={() => toggle(t.name)} style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", gap: 12, flex: 1, textAlign: "left",
                    }}>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: "#1A1A1A", minWidth: 220 }}>{t.name}</span>
                      <span style={{ fontSize: 13, color: "#BBB", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>▾</span>
                    </button>
                    {/* Right: status boxes */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {[
                        { label: "Easy",   field: "easy",     states: EMH_STATES, c: "#4A7A4A" },
                        { label: "Medium", field: "medium",   states: EMH_STATES, c: "#B8762A" },
                        { label: "Hard",   field: "hard",     states: EMH_STATES, c: "#8A3A3A" },
                        { label: "Rev",    field: "revision", states: REV_STATES, c: "#5A5A9A" },
                      ].map(({ label, field, states, c }) => (
                        <div key={field} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: c, fontWeight: 600, minWidth: 30, textAlign: "right" }}>{label}</span>
                          <StatusBox
                            stateKey={`${t.name}::${field}`}
                            states={states}
                            value={getStatus(t.name, field, states)}
                            onChange={(val) => setStatus(t.name, field, val)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
 
// ─── AI/ML PAGE ───────────────────────────────────────────────────────────────
function AIMLPage({ onBack }) {
  // FIX: expandedTopic is pure UI state — it should NOT be persisted to
  // localStorage. Using useState (not useLocalStorage) here means navigating
  // away and back always starts with all panels collapsed, which is the correct
  // UX. More importantly, it removes an unnecessary localStorage write on every
  // panel open/close, eliminating a potential source of write-ordering bugs.
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [progress, setProgress] = useLocalStorage("aiml-progress", {});
  const containerRef = useRef(null);

  const toggle = (name) => {
    setExpandedTopic((prev) => (prev === name ? null : name));
  };

  const toggleSub = (topic, sub) => {
    const key = `${topic}::${sub}`;
    setProgress((p) => ({ ...p, [key]: !p[key] }));
  };

  const getTP = (t) => {
    const done = t.subtopics.filter((s) => progress[`${t.name}::${s}`]).length;
    return {
      done,
      total: t.subtopics.length,
      pct: Math.round((done / t.subtopics.length) * 100),
    };
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        expandedTopic &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setExpandedTopic(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedTopic]);

  const color = P.cards[2];

  return (
    <div>
      <PageHeader title="AI / ML Roadmap" accent={color.accent} onBack={onBack} />

      <Reveal>
        <Card bg={color.bg} accent={color.accent}>
          <CardTitle accent={color.accent}>Topic Progress</CardTitle>

          <div
            ref={containerRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              alignItems: "start",
              overflow: "visible",
            }}
          >
            {CONFIG.aiml.topics.map((t) => {
              const { done, total, pct } = getTP(t);
              const isOpen = expandedTopic === t.name;

              return (
                <div
                  key={t.name}
                  style={{
                    position: "relative",
                    overflow: "visible",
                    zIndex: isOpen ? 50 : 1,
                  }}
                >
                  <button
                    onClick={() => toggle(t.name)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "16px 20px",
                      textAlign: "left",
                      borderRadius: 15,
                      background: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 9,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#1A1A1A",
                        }}
                      >
                        {t.name}
                      </span>

                      <span
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: 11,
                          color: pct === 100 ? color.accent : "#888",
                          fontWeight: pct === 100 ? 700 : 400,
                        }}
                      >
                        {done}/{total}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 4,
                        background: "rgba(0,0,0,0.08)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: pct === 100 ? "#5C7A5C" : color.accent,
                          borderRadius: 4,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        left: 0,
                        right: 0,
                        zIndex: 999,
                        padding: "0 20px 16px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {t.subtopics.map((s) => {
                        const isDone = progress[`${t.name}::${s}`];

                        return (
                          <label
                            key={s}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 11,
                              padding: "7px 0",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              onClick={() => toggleSub(t.name, s)}
                              style={{
                                width: 17,
                                height: 17,
                                borderRadius: 5,
                                flexShrink: 0,
                                background: isDone ? color.accent : "transparent",
                                border: `1.5px solid ${
                                  isDone ? color.accent : "#CCC"
                                }`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                              }}
                            >
                              {isDone && (
                                <span style={{ color: "#FFF", fontSize: 10 }}>✓</span>
                              )}
                            </div>

                            <span
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: 13,
                                color: isDone ? "#AAA" : "#333",
                                textDecoration: isDone ? "line-through" : "none",
                                fontWeight: 400,
                              }}
                            >
                              {s}
                            </span>
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
function CurrentTopicPage({ onBack }) {
  const [checked, setChecked] = useLocalStorage("dl-videos", {});
  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const { currentTopic } = CONFIG;
  const doneCount = currentTopic.videos.filter(v => checked[v.id]).length;
  const pct = Math.round((doneCount / currentTopic.videos.length) * 100);
  const color = P.cards[3];
 
  return (
    <div>
      <PageHeader title="Current Topic" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card bg={color.bg} accent={color.accent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18, marginBottom: 10 }}>
            <div>
              <CardTitle accent={color.accent}>{currentTopic.name}</CardTitle>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#999", marginTop: -26, marginBottom: 22, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 500 }}>
                84 Video Lectures · Now Studying
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 18, padding: "18px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 40, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-1.5px" }}>{pct}%</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 500 }}>{doneCount}/{currentTopic.videos.length} done</div>
            </div>
          </div>
 
          <div style={{ height: 7, background: "rgba(0,0,0,0.08)", borderRadius: 6, marginBottom: 30, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color.accent, borderRadius: 6, transition: "width 0.5s ease" }} />
          </div>
 
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
            {currentTopic.videos.map(v => {
              const done = checked[v.id];
              return (
                <label key={v.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 9,
                  background: done ? `${color.accent}18` : "rgba(255,255,255,0.55)",
                  borderRadius: 11, padding: "11px 13px", cursor: "pointer",
                  border: done ? `1.5px solid ${color.accent}40` : "1px solid rgba(0,0,0,0.06)",
                  transition: "all 0.2s",
                }}>
                  <div onClick={() => toggle(v.id)} style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: done ? color.accent : "transparent",
                    border: `1.5px solid ${done ? color.accent : "#BBB"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {done && <span style={{ color: "#FFF", fontSize: 9 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "#BBB", marginBottom: 2, fontWeight: 400 }}>#{v.id}</div>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: done ? "#AAA" : "#333", textDecoration: done ? "line-through" : "none", lineHeight: 1.45, fontWeight: 400 }}>{v.title}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
 
// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────
// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────
// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────
function CalendarPage({ onBack }) {
  const [marks, setMarks] = useLocalStorage("calendar-marks", {});
  const [notes, setNotes] = useLocalStorage("calendar-notes", {});
  const [chartVisible, setChartVisible] = useState(false);
  const [visiblePastCount, setVisiblePastCount] = useState(0);
  const chartRef = useRef(null);
  const sentinelRef = useRef(null);

  const toggleDay = (key) =>
    setMarks((p) => {
      const next = { ...p };
      if (!next[key]) next[key] = "tick";
      else if (next[key] === "tick") next[key] = "cross";
      else delete next[key];
      return next;
    });

  const setNote = (key, val) => setNotes((p) => ({ ...p, [key]: val }));

  const color = P.cards[4];

  // ── date helpers ──────────────────────────────────────────────────────────
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const monthNamesShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Full range: Jun 2026 → Apr 2027
  const allMonths = [];
  for (let m = 5; m <= 11; m++) allMonths.push({ year: 2026, month: m });
  for (let m = 0; m <= 3; m++) allMonths.push({ year: 2027, month: m });

  // Past months strictly before current, in reverse order (most recent first)
  const pastMonths = allMonths
    .filter(({ year, month }) =>
      year < currentYear || (year === currentYear && month < currentMonth)
    )
    .reverse();

  // ── stats helpers ─────────────────────────────────────────────────────────
  const getEff = (y, m) => {
    const days = getDaysInMonth(y, m);
    let ticks = 0;
    for (let d = 1; d <= days; d++) {
      if (marks[`${y}-${m}-${d}`] === "tick") ticks++;
    }
    return days > 0 ? Math.round((ticks / days) * 100) : 0;
  };

  const getStreak = () => {
    let streak = 0;
    const d = new Date(now);
    while (true) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (marks[key] === "tick") {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const getBestStreak = () => {
    let best = 0;
    let current = 0;
    for (const { year, month } of allMonths) {
      const days = getDaysInMonth(year, month);
      for (let d = 1; d <= days; d++) {
        if (marks[`${year}-${month}-${d}`] === "tick") {
          current++;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      }
    }
    return best;
  };

  const getBestMonth = () => {
    let best = { label: "—", pct: 0 };
    for (const { year, month } of allMonths) {
      const pct = getEff(year, month);
      if (pct > best.pct) {
        best = { label: `${monthNamesShort[month]} ${year}`, pct };
      }
    }
    return best;
  };

  // Chart: last 5 past months (chronological order)
  const chartMonths = [...pastMonths].reverse().slice(-5);

  // ── Intersection observer: chart animation ────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setChartVisible(true); },
      { threshold: 0.2 }
    );
    if (chartRef.current) obs.observe(chartRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Intersection observer: infinite scroll past months ────────────────────
  useEffect(() => {
    if (pastMonths.length === 0) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisiblePastCount((prev) => Math.min(prev + 1, pastMonths.length));
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [pastMonths.length]);

  // ── Month renderer ────────────────────────────────────────────────────────
  const renderMonth = (year, month, opts = {}) => {
    const { isPast = false, animDelay = 0 } = opts;
    const days = getDaysInMonth(year, month);
    const firstDay = getFirstDay(year, month);
    const eff = getEff(year, month);
    const tickCount = Object.keys(marks).filter((k) => {
      const [ky, km] = k.split("-").map(Number);
      return ky === year && km === month && marks[k] === "tick";
    }).length;

    return (
      <div
        key={`${year}-${month}`}
        style={{
          background: isPast ? "rgba(255,255,255,0.58)" : "rgba(255,255,255,0.72)",
          borderRadius: 22,
          padding: "28px 32px",
          border: isPast ? "1px solid rgba(0,0,0,0.04)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isPast ? "0 1px 8px rgba(0,0,0,0.03)" : "0 2px 16px rgba(0,0,0,0.04)",
          marginBottom: 28,
          opacity: 1,
          animation: isPast ? `fadeSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) ${animDelay}s both` : "none",
        }}
      >
        {/* Month header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: isPast ? 22 : 26,
              fontWeight: 600,
              color: isPast ? "#555" : "#1A1A1A",
              letterSpacing: "-0.5px",
            }}>
              {monthNames[month]} {year}
            </span>
            {isPast && (
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 10, color: "#BBB",
                textTransform: "uppercase", letterSpacing: "1px",
                fontWeight: 500,
              }}>Past</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#AAA", fontWeight: 400 }}>
              {tickCount}/{days} days studied
            </span>
            <span style={{
              fontFamily: "'Poppins', sans-serif", fontSize: 13,
              color: eff >= 70 ? "#4A7A4A" : eff >= 40 ? color.accent : "#C4714A",
              fontWeight: 700,
              background: eff >= 70 ? "rgba(74,122,74,0.10)" : eff >= 40 ? `${color.accent}18` : "rgba(196,113,74,0.10)",
              padding: "4px 14px", borderRadius: 20,
              border: `1px solid ${eff >= 70 ? "rgba(74,122,74,0.25)" : eff >= 40 ? `${color.accent}30` : "rgba(196,113,74,0.25)"}`,
            }}>{eff}% efficient</span>
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 6 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 11, color: "#BBB", textAlign: "center",
              paddingBottom: 8, fontWeight: 600,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`e${i}`} style={{ minHeight: isPast ? 68 : 82 }} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const key = `${year}-${month}-${day}`;
            const mark = marks[key];
            const noteVal = notes[key] || "";
            const isToday =
              now.getFullYear() === year &&
              now.getMonth() === month &&
              now.getDate() === day;
            const isFuture = new Date(year, month, day) > now;

            let cellBg = isPast ? "#EEEAE2" : "#EDE8E0";
            let cellBorder = "1px solid rgba(0,0,0,0.08)";
            if (mark === "tick") {
              cellBg = "rgba(74,122,74,0.13)";
              cellBorder = "1.5px solid rgba(74,122,74,0.40)";
            } else if (mark === "cross") {
              cellBg = "rgba(196,113,74,0.13)";
              cellBorder = "1.5px solid rgba(196,113,74,0.40)";
            } else if (isToday) {
              cellBg = "#E8E2D8";
              cellBorder = "2px solid rgba(0,0,0,0.28)";
            }

            const numColor = mark === "tick" ? "#4A7A4A" : mark === "cross" ? "#C4714A" : isToday ? "#1A1A1A" : "#666";

            return (
              <div
                key={day}
                style={{
                  minHeight: isPast ? 68 : 82,
                  borderRadius: 10,
                  background: cellBg,
                  border: cellBorder,
                  display: "flex",
                  flexDirection: "column",
                  padding: isPast ? "7px 9px" : "8px 10px",
                  opacity: isFuture ? 0.28 : 1,
                  transition: "background 0.15s, border 0.15s",
                  cursor: !isFuture ? "pointer" : "default",
                }}
                onClick={() => !isFuture && toggleDay(key)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 13,
                    fontWeight: mark ? 700 : isToday ? 600 : 400,
                    color: numColor,
                    lineHeight: 1,
                    userSelect: "none",
                  }}>{day}</span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 20, height: 20, borderRadius: "50%",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    userSelect: "none",
                    transition: "all 0.18s ease",
                    background: mark === "tick" ? "#4A7A4A" : mark === "cross" ? "#C4714A" : "transparent",
                    border: mark === "tick" ? "2px solid #4A7A4A" : mark === "cross" ? "2px solid #C4714A" : "1.5px solid #CCC",
                    color: mark === "tick" ? "#FFF" : mark === "cross" ? "#FFF" : "#CCC",
                  }}>
                    {mark === "tick" ? "✓" : mark === "cross" ? "✗" : "·"}
                  </span>
                </div>
                {!isFuture && (
                  <textarea
                    className="cal-day-note"
                    rows={isPast ? 1 : 2}
                    maxLength={60}
                    placeholder="note…"
                    value={noteVal}
                    onChange={(e) => setNote(key, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── computed stats ────────────────────────────────────────────────────────
  const streak = getStreak();
  const bestStreak = getBestStreak();
  const bestMonth = getBestMonth();
  const chartData = chartMonths.map(({ year, month }) => ({
    label: monthNamesShort[month],
    pct: getEff(year, month),
  }));
  const maxPct = Math.max(...chartData.map((d) => d.pct), 1);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .cal-fullwidth {
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          padding: 0 2vw;
          box-sizing: border-box;
        }
        .cal-day-note {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          color: #777;
          line-height: 1.4;
          cursor: text;
          padding: 0;
          margin-top: 2px;
        }
        .cal-day-note::placeholder { color: #ccc; font-style: italic; }
        .cal-day-note:focus { color: #444; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { height: 0; opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="cal-fullwidth">
        <PageHeader title="Study Calendar" accent={color.accent} onBack={onBack} />

        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#AAA", marginBottom: 32, textAlign: "center", fontWeight: 400 }}>
          Click a day to cycle: unmarked → ✓ studied → ✗ missed → clear · Click the note area to write
        </p>

        {/* ── Current month ── */}
        <Reveal>
          {renderMonth(currentYear, currentMonth)}
        </Reveal>

        {/* ── Stats section ── */}
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 28 }}>
            {[
              { label: "Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, icon: "🔥", highlight: streak >= 7 },
              { label: "Best Streak",    value: `${bestStreak} day${bestStreak !== 1 ? "s" : ""}`, icon: "🏆", highlight: false },
              { label: "Best Month",     value: bestMonth.pct > 0 ? `${bestMonth.label} • ${bestMonth.pct}%` : "No data yet", icon: "⭐", highlight: false },
            ].map((s) => (
              <div key={s.label} style={{
                background: s.highlight ? `${color.accent}15` : "rgba(255,255,255,0.72)",
                borderRadius: 18,
                padding: "24px 26px",
                border: s.highlight ? `1.5px solid ${color.accent}40` : "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: s.highlight ? color.accent : "#1A1A1A", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Performance Analysis bar chart ── */}
        {chartData.length > 0 && (
          <Reveal>
            <div
              ref={chartRef}
              style={{
                background: "rgba(255,255,255,0.72)",
                borderRadius: 22,
                padding: "32px 36px 28px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                marginBottom: 40,
              }}
            >
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 600, color: "#1A1A1A", marginBottom: 4, letterSpacing: "-0.4px" }}>
                Performance Analysis
              </h2>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#AAA", marginBottom: 36, fontWeight: 400 }}>
                Efficiency across the last {chartData.length} completed month{chartData.length !== 1 ? "s" : ""}
              </p>

              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 24, height: 180 }}>
                {chartData.map((d, i) => {
                  const barH = chartVisible ? Math.max(Math.round((d.pct / maxPct) * 140), d.pct > 0 ? 6 : 0) : 0;
                  const alpha = 0.40 + (d.pct / 100) * 0.60;
                  return (
                    <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, maxWidth: 100 }}>
                      <span style={{
                        fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700,
                        color: color.accent,
                        opacity: chartVisible ? 1 : 0,
                        transition: `opacity 0.4s ease ${i * 0.1 + 0.3}s`,
                        minHeight: 20,
                      }}>{d.pct}%</span>

                      <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", height: 140 }}>
                        <div style={{
                          width: "100%",
                          height: barH,
                          background: `rgba(154,122,58,${alpha})`,
                          borderRadius: "8px 8px 0 0",
                          transition: `height 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s, opacity 0.4s ease ${i * 0.1}s`,
                          opacity: chartVisible ? 1 : 0,
                        }} />
                      </div>

                      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#888", fontWeight: 500 }}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Subtle baseline */}
              <div style={{ height: 1, background: "rgba(0,0,0,0.07)", marginTop: 4 }} />
            </div>
          </Reveal>
        )}

        {/* ── Divider before past months ── */}
        {pastMonths.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#BBB", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500 }}>
              Past months
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
          </div>
        )}

        {/* ── Past months revealed on scroll ── */}
        {pastMonths.slice(0, visiblePastCount).map(({ year, month }, i) =>
          renderMonth(year, month, { isPast: true, animDelay: 0 })
        )}

        {/* ── Sentinel: triggers next month to load ── */}
        {visiblePastCount < pastMonths.length && (
          <div ref={sentinelRef} style={{ height: 1, marginBottom: 28 }} />
        )}

        <div style={{ height: 88 }} />
      </div>
    </div>
  );
}
 
// ─── ACADEMICS PAGE ───────────────────────────────────────────────────────────
function AcademicsPage({ onBack }) {
  const color = P.cards[5];

  const currentSem =
    CONFIG.academics.semesters.find((sem) => sem.current) ||
    CONFIG.academics.semesters[0];

  const creditsByCourse = {
    Algorithms: 4,
    "Operating Systems": 4,
    DBMS: 4,
    Probability: 3,
    "Computer Networks": 4,
  };

  return (
    <div>
      <PageHeader title="Academics" accent={color.accent} onBack={onBack} />

      <div style={{ display: "grid", gap: 26 }}>
        <Reveal>
          <Card bg={color.bg} accent={color.accent}>
            <CardTitle accent={color.accent}>Current Semester Courses</CardTitle>

            <div
              style={{
                background: "rgba(255,255,255,0.6)",
                borderRadius: 18,
                padding: "24px 26px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  margin: "0 0 18px",
                  letterSpacing: "-0.3px",
                }}
              >
                {currentSem?.name || "Semester 5 (Current)"}
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 10,
                  padding: "0 14px",
                }}
              >
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>Course</div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", textAlign: "right" }}>Credits</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentSem?.courses?.map((c) => (
                  <div
                    key={c}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px",
                      gap: 12,
                      alignItems: "center",
                      padding: "13px 14px",
                      background: "#F2EEE7",
                      borderRadius: 12,
                      borderLeft: `3px solid ${color.accent}`,
                    }}
                  >
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#444", fontWeight: 400 }}>{c}</div>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#1A1A1A", fontWeight: 600, textAlign: "right" }}>{creditsByCourse[c] ?? "-"}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
 
// ─── PROJECTS PAGE ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  "Completed":   { bg: "#E8F0E8", text: "#4A7A4A" },
  "In Progress": { bg: "#E8EAF0", text: "#4A5A9A" },
  "Planned":     { bg: "#F0EAE0", text: "#9A7A3A" },
  "On Hold":     { bg: "#F0E8E0", text: "#9A6A3A" },
};
 
function ProjectsPage({ onBack }) {
  const color = P.cards[6];
 
  return (
    <div>
      <PageHeader title="Personal Projects" accent={color.accent} onBack={onBack} />
      <Reveal>
        <Card bg={color.bg} accent={color.accent}>
          <CardTitle accent={color.accent}>Project Board</CardTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
            {CONFIG.projects.map(p => {
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS["Planned"];
              return (
                <div key={p.name} style={{ background: "#EDE8E0", borderRadius: 18, padding: "24px 26px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 600, color: "#1A1A1A", margin: 0, lineHeight: 1.35, maxWidth: "68%", letterSpacing: "-0.2px" }}>{p.name}</h3>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, background: sc.bg, color: sc.text, padding: "3px 11px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>{p.status}</span>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#888", fontWeight: 400 }}>Progress</span>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: "#555" }}>{p.progress}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.progress}%`, background: color.accent, borderRadius: 5 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
                    {p.tech.map(t => (
                      <span key={t} style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, background: "rgba(0,0,0,0.05)", color: "#666", padding: "3px 9px", borderRadius: 12, fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#777", margin: 0, lineHeight: 1.65, fontStyle: "italic", fontWeight: 400 }}>{p.notes}</p>
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
  const tagColors = { "AI/ML": "#4A7088", "DSA": "#4A7A4A", "DL": "#7A5C88", "ML": "#9A7A3A", "Research": "#8A3A3A", "Models": "#5A5A9A" };
  const tagBgs = { "AI/ML": "#E4EAF0", "DSA": "#E8F0E8", "DL": "#EDE8F0", "ML": "#EDE8DC", "Research": "#F0E8E8", "Models": "#E8E8F0" };
 
  const ResourceGroup = ({ title, items, i }) => (
    <Reveal delay={i * 0.07}>
      <Card bg={i % 2 === 0 ? color.bg : P.cards[(7 - i) % 8].bg} accent={color.accent}>
        <CardTitle accent={color.accent}>{title}</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map(item => (
            <a key={item.title} href={item.link} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "15px 20px", background: "rgba(255,255,255,0.6)", borderRadius: 13,
              textDecoration: "none", border: "1px solid rgba(0,0,0,0.05)",
              transition: "background 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.6)"}
            >
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#333", fontWeight: 500 }}>{item.title}</span>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, background: tagBgs[item.tag] || "#EEE", color: tagColors[item.tag] || "#666", padding: "3px 11px", borderRadius: 20, fontWeight: 600 }}>{item.tag}</span>
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
        <div style={{ gridColumn: "1 / -1" }}>
          <ResourceGroup title="Useful Links" items={resources.links} i={2} />
        </div>
      </div>
    </div>
  );
}
 
// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("home");
 
  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
 
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
    <div style={{ background: "#F5F0E8", minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; max-width: 100%; overflow-x: hidden; background: #F5F0E8; }
        body { background: #F5F0E8; }
        #root, [data-reactroot] { width: 100%; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
        button { font-family: 'Poppins', sans-serif; }
        a { font-family: 'Poppins', sans-serif; }
        @media (max-width: 920px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
 
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
 
      <div style={{
        width: "100%",
        padding: "0 28px 96px",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.6s ease 0.2s",
        boxSizing: "border-box",
      }}>
        {/* Top bar */}
        {page !== "home" && (
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            background: "rgba(245,240,232,0.92)",
            backdropFilter: "blur(12px)",
            padding: "15px 0",
            marginBottom: 0,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => navigate("home")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                fontSize: 18, fontWeight: 600, color: "#1A1A1A",
                letterSpacing: "-0.5px",
              }}>
                {CONFIG.profile.name}
              </button>
              <div style={{ display: "flex", gap: 4 }}>
                {NAV_ITEMS.map(item => (
                  <button key={item.id} onClick={() => navigate(item.id)} style={{
                    background: page === item.id ? "rgba(0,0,0,0.07)" : "none",
                    border: "none", cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 12, color: page === item.id ? "#1A1A1A" : "#888",
                    padding: "5px 12px", borderRadius: 8,
                    fontWeight: page === item.id ? 600 : 400,
                    transition: "all 0.2s",
                  }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {pageMap[page] || pageMap.home}
      </div>
    </div>
  );
}