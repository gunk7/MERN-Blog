import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MoveRight,
  UserPlus,
  LogIn,
  Wand2,
  PenLine,
  BookOpen,
} from "lucide-react";
import {
  selectCurrentUser,
  selectToken,
} from "../redux/selectors/authSelectors";

// ─── Quotes ────────────────────────────────────────────────────────────────
const QUOTES = [
  {
    text: "A writer only begins a book. A reader finishes it.",
    author: "Samuel Johnson",
  },
  {
    text: "There is no greater agony than bearing an untold story inside you.",
    author: "Maya Angelou",
  },
  {
    text: "Write. Rewrite. When not writing or rewriting, read. I know of no shortcuts.",
    author: "Larry L. King",
  },
];

// ─── Quote slider ──────────────────────────────────────────────────────────
function QuoteSlider() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [next, setNext] = useState(null);

  const goTo = (n) => {
    if (n === idx || phase !== "idle") return;
    setNext(n);
    setPhase("exit");
  };

  useEffect(() => {
    if (phase === "exit") {
      const t = setTimeout(() => {
        setIdx(next);
        setPhase("enter");
      }, 380);
      return () => clearTimeout(t);
    }
    if (phase === "enter") {
      const t = setTimeout(() => setPhase("idle"), 400);
      return () => clearTimeout(t);
    }
  }, [phase, next]);

  useEffect(() => {
    const id = setInterval(() => goTo((idx + 1) % QUOTES.length), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  const quote = QUOTES[idx];

  return (
    <blockquote className="border-l-2 border-purple-500 pl-6 my-2">
      <div
        style={{
          transition: "opacity 0.38s ease, transform 0.38s ease",
          opacity: phase === "exit" ? 0 : 1,
          transform: phase === "exit" ? "translateX(-20px)" : "translateX(0)",
        }}
      >
        <p className="text-lg italic text-gray-700 leading-relaxed font-light">
          "{quote.text}"
        </p>
        <cite className="text-xs text-purple-700 not-italic mt-3 block font-semibold tracking-wider uppercase">
          — {quote.author}
        </cite>
      </div>
      <div className="flex gap-2 mt-5">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            aria-label={`Quote ${i + 1}`}
            onClick={() => goTo(i)}
            className="border-none p-0 cursor-pointer transition-all duration-300"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: i === idx ? "#6a5188" : "#e9e2f8",
            }}
          />
        ))}
      </div>
    </blockquote>
  );
}

// ─── useInView ─────────────────────────────────────────────────────────────
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Bento themes ──────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    card: "bg-[#261e35] border-[#261e35]",
    label: "text-[#aa95c6]",
    num: "text-white/[0.03]",
    title: "text-[#f3ebff]",
    body: "text-[#b3acc0]",
    tag: "bg-white/[0.07] text-[#c9bfdb] border-white/[0.08]",
    preview: "bg-white/[0.05] border-white/10 text-[#b3acc0]",
    dot: "bg-[#8e74ae]",
    chip: "text-[#c9bfdb]",
  },
  purple: {
    card: "bg-[#6a5188] border-[#6a5188]",
    label: "text-[#e9e2f8]",
    num: "text-white/[0.03]",
    title: "text-[#f3ebff]",
    body: "text-[#e9e2f8]",
    tag: "bg-white/10 text-[#f3ebff] border-white/10",
    preview: "bg-white/10 border-white/10 text-[#e9e2f8]",
    dot: "bg-[#e9e2f8]",
    chip: "text-[#f3ebff]",
  },
  tinted: {
    card: "bg-[#f3ebff] border-[#e9e2f8]",
    label: "text-[#6a5188]",
    num: "text-[#e9e2f8]",
    title: "text-[#261e35]",
    body: "text-[#5c546b]",
    tag: "bg-[#f3ebff] text-[#6a5188] border-[#e9e2f8]",
    preview: "bg-[#faf9ff] border-[#e9e2f8] text-[#5c546b]",
    dot: "bg-[#d8bafa]",
    chip: "text-[#4a3866]",
  },
  white: {
    card: "bg-white border-[#e9e2f8]",
    label: "text-[#6b637a]",
    num: "text-[#e9e2f8]",
    title: "text-[#261e35]",
    body: "text-[#6b637a]",
    tag: "bg-[#f3ebff] text-[#6a5188] border-[#e9e2f8]",
    preview: "bg-[#faf9ff] border-[#e9e2f8] text-[#6b637a]",
    dot: "bg-[#d8bafa]",
    chip: "text-[#6b637a]",
  },
};

const BENTO_CARDS = [
  {
    id: "write",
    span: "wide",
    theme: "dark",
    label: "01 — Write freely",
    num: "01",
    title: "A distraction-free editor",
    body: "Built completely for long-form focus. No structural noise, no metrics clutter. Just you and the empty canvas page.",
  },
  {
    id: "ai-writing",
    span: "narrow",
    theme: "tinted",
    label: "AI — Assistant",
    title: "Rewrite & Refine.",
    body: "Select any text block, pick an style action contextually.",
    extra: "writing",
  },
  {
    id: "ai-tags",
    span: "half",
    theme: "white",
    label: "AI — Smart tags",
    title: "Tags, generated.",
    body: "Finish writing your pieces. One single click matches perfect structural taxonomy tags automatically.",
    extra: "tags",
  },
  {
    id: "share",
    span: "half",
    theme: "purple",
    label: "02 — Share voice",
    num: "02",
    title: "Publish instantly.",
    body: "Your stories reach real humans who care about structural narrative craft, not cheap algorithm clicks.",
  },
  {
    id: "ai-summary",
    span: "narrow",
    theme: "white",
    label: "AI — Summary",
    title: "Summarise work.",
    body: "Full post text or selection highlights translated into a clean layout preview context instantly.",
    extra: "summary",
  },
  {
    id: "discover",
    span: "wide",
    theme: "dark",
    label: "03 — Discover",
    num: "03",
    title: "Curated editorial feeds.",
    body: "Discover curated works built around human layout writers, devoid of engagement optimization hooks.",
    extra: "genres",
  },
];

const GENRES = ["Essays", "Fiction", "Poetry", "Craft Insights"];
const WRITING_ACTIONS = [
  "Improve clarity",
  "Make it formal",
  "Simplify structure",
];
const SAMPLE_TAGS = ["craft", "short fiction", "narrative layout"];
const SPAN_CLASS = {
  wide: "col-span-4 max-sm:col-span-2",
  narrow: "col-span-2",
  half: "col-span-3 max-sm:col-span-2",
};

function BentoCard({ card, delay, visible }) {
  const t = THEMES[card.theme];
  return (
    <div
      className={`${SPAN_CLASS[card.span]} ${t.card} rounded-[24px] border p-8 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {card.num && (
        <div
          className={`absolute right-4 top-2 font-serif text-[110px] italic font-bold select-none pointer-events-none leading-none ${t.num}`}
        >
          {card.num}
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-2">
        <span
          className={`text-[10px] tracking-[0.3em] uppercase font-bold block ${t.label}`}
        >
          {card.label}
        </span>
        <span
          className={`font-serif text-xl sm:text-2xl font-medium block tracking-tight leading-tight mt-1 ${t.title}`}
        >
          {card.title}
        </span>
        <p
          className={`font-body text-[13.5px] leading-relaxed max-w-prose ${t.body}`}
        >
          {card.body}
        </p>
      </div>

      <div className="relative z-10 mt-4">
        {card.extra === "writing" && (
          <div
            className={`rounded-[12px] border p-3 flex flex-col gap-2 ${t.preview}`}
          >
            {WRITING_ACTIONS.map((a) => (
              <div key={a} className="flex items-center gap-2.5 text-xs">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`}
                />
                <span className={`font-medium ${t.chip}`}>{a}</span>
              </div>
            ))}
          </div>
        )}
        {card.extra === "tags" && (
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_TAGS.map((tag) => (
              <span
                key={tag}
                className={`text-[11px] px-3 py-1 rounded-full border font-medium ${t.tag}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {card.extra === "summary" && (
          <div
            className={`rounded-[12px] border p-3 text-xs italic leading-relaxed ${t.preview}`}
          >
            "A structural analysis exploring how selective silence shapes a
            writer's modern voice."
          </div>
        )}
        {card.extra === "genres" && (
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <span
                key={g}
                className={`text-[11px] px-3 py-1 rounded-full border font-medium ${t.tag}`}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CTA_FEATURES = [
  {
    icon: <PenLine size={16} />,
    title: "Write without limits",
    body: "A clean, responsive content editor that disappears while you think — full markdown support alongside intentional typography assets.",
  },
  {
    icon: <Wand2 size={16} />,
    title: "AI that understands context",
    body: "Three custom assistive pipelines engineered directly into your editing layout viewport — no structural tab switching required.",
  },
  {
    icon: <BookOpen size={16} />,
    title: "A community built around craft",
    body: "Curated organic indexes surface written layout profiles using zero algorithmic tracking metrics or attention traps.",
  },
];

// ─── Main Home Component ──────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const access = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);

  const heroRef = useRef(null);
  const bentoRef = useRef(null);
  const ctaRef = useRef(null);

  const { visible: heroVisible } = useInView(0.5);
  const { visible: bentoInView } = useInView(0.5);
  const { visible: ctaInView } = useInView(0.5);

  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (heroVisible) setActiveSection(0);
      else if (bentoInView && !access) setActiveSection(1);
      else if (ctaInView && !access) setActiveSection(2);
    });
  }, [heroVisible, bentoInView, ctaInView, access]);

  const scrollToSection = (elementRef) => {
    elementRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sections = [
    { id: 0, ref: heroRef, label: "Hero Overview" },
    ...(!access
      ? [
          { id: 1, ref: bentoRef, label: "Features Grid" },
          { id: 2, ref: ctaRef, label: "Get Started" },
        ]
      : []),
  ];

  return (
    <div className="relative w-full h-screen bg-[#faf9ff] font-body antialiased selection:bg-purple-100 overflow-hidden">
      {/* ── STICKY FLOATING 3-DOT TRACKER NAVIGATION ───────────────── */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 bg-white/60 backdrop-blur-md px-3 py-4 rounded-full border border-purple-100/40 shadow-sm transition-opacity duration-300">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => scrollToSection(sec.ref)}
            aria-label={`Scroll to ${sec.label}`}
            className="group relative flex items-center justify-center border-none bg-transparent p-0 cursor-pointer"
          >
            <span className="absolute right-8 text-[11px] font-bold tracking-wider text-purple-900 bg-white border border-purple-50 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm whitespace-nowrap">
              {sec.label}
            </span>
            <div
              className={`rounded-full transition-all duration-300 ${
                activeSection === sec.id
                  ? "w-3 h-3 bg-[#6a5188] ring-4 ring-purple-100"
                  : "w-2 h-2 bg-purple-300 hover:bg-[#6a5188] hover:scale-125"
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── SCROLL COMPONENT CONTAINER W/ HIDDEN SCROLLBARS ────────── */}
      <div
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none !important;
          }
        `}</style>

        {/* ── SECTION 1: HERO (REBALANCED TO REMOVE GAPING SPACE) ── */}
        <section
          ref={heroRef}
          className="w-full h-screen snap-start grid grid-cols-1 md:grid-cols-[12fr_8fr] border-b border-gray-200 overflow-hidden shrink-0 bg-white"
        >
          {/* Left Panel: Giant Typography + Structural Bottom Anchor */}
          <div className="pl-16 pr-8 lg:pl-28 py-16 flex flex-col justify-between h-full border-r border-gray-100">
            {/* Minimal Header Accent */}
            <div className="pt-2">
              <p className="text-[11px] tracking-[0.4em] uppercase text-purple-700 font-black">
                A writer's platform
              </p>
            </div>

            {/* Giant Centerpiece Header */}
            <div className="my-auto py-8">
              {access ? (
                <h1 className="font-serif font-normal text-7xl sm:text-8xl lg:text-[120px] tracking-tight text-gray-900 leading-[0.9]">
                  Greetings,
                  <br />
                  <em className="italic text-purple-600 font-light block mt-4">
                    {user?.username}.
                  </em>
                </h1>
              ) : (
                <h1 className="font-serif font-normal text-8xl sm:text-9xl lg:text-[135px] tracking-tight text-gray-900 leading-[0.88]">
                  <span className="block text-gray-900 font-medium tracking-tight">
                    Write.
                  </span>
                  <em className="italic text-purple-600 font-light block my-2">
                    Explore.
                  </em>
                  <span className="block font-black text-gray-900 tracking-tighter">
                    Repeat.
                  </span>
                </h1>
              )}
            </div>

            {/* Anchored Sub-Footer Block to anchor the bottom space */}
            {/* <div className="max-w-md border-t border-gray-100 pt-6">
              <p className="text-xs tracking-widest text-gray-400 uppercase font-bold">
                Wavelog Editorial System V1.0
              </p>
            </div> */}
          </div>

          {/* Right Panel: Functional Split Card Layout */}
          <div className="bg-[#faf9ff] flex flex-col justify-between p-16 lg:p-24 h-full relative">
            {/* Subtle decorative geometry to populate empty space organically */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/20 to-transparent pointer-events-none" />

            <div className="my-auto w-full max-w-md relative z-10 flex flex-col gap-10">
              {access ? (
                <div className="flex flex-col gap-6">
                  <p className="text-xl text-gray-700 leading-relaxed font-light">
                    Your creative dashboard is completely initialized. Let's
                    step directly back into your unfinished drafts.
                  </p>
                  <button
                    className="flex items-center justify-center gap-3 bg-[#6a5188] hover:bg-[#584273] text-white font-medium px-8 py-4 rounded-full transition-all duration-200 shadow-md text-base group"
                    onClick={() => navigate("/profile")}
                  >
                    Go to Dashboard{" "}
                    <MoveRight
                      size={20}
                      className="transform group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xl text-gray-600 leading-relaxed font-light">
                    A minimalist sanctuary built exclusively for high-intent
                    writers and readers. Discover stories that stick, publish
                    configurations that echo.
                  </p>

                  {/* Clean Quote Wrapper Box */}
                  <div className="bg-white border border-purple-100/60 shadow-sm rounded-2xl p-6">
                    <QuoteSlider />
                  </div>

                  {/* Actions Block */}
                  <div className="flex flex-col gap-4 pt-2">
                    <button
                      className="flex items-center justify-center gap-3 bg-[#6a5188] hover:bg-[#584273] text-white font-bold px-8 py-4.5 rounded-full transition-all duration-200 shadow-lg text-base tracking-wide"
                      onClick={() => navigate("/signup")}
                    >
                      <UserPlus size={18} /> Start writing today
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 font-bold text-gray-700 hover:text-purple-700 transition-colors group py-3 text-sm tracking-wide"
                      onClick={() => navigate("/login")}
                    >
                      <LogIn size={18} />
                      <span className="border-b-2 border-transparent group-hover:border-purple-700 pb-0.5 transition-all">
                        Already have an account? Sign in
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right block bottom accent */}
            <div className="text-right relative z-10">
              <span className="text-xs font-serif italic text-purple-400">
                Where thoughts find rhythm.
              </span>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: BENTO GRID ─────────────────────────────────── */}
        {!access && (
          <section
            ref={bentoRef}
            className="w-full h-screen snap-start flex flex-col justify-center px-12 lg:px-20 overflow-hidden shrink-0 bg-[#faf9ff]"
          >
            <div className="mb-8 max-w-3xl">
              <p className="text-[11px] tracking-[0.35em] uppercase text-purple-700 font-extrabold mb-3">
                Everything you need
              </p>
              <h2 className="font-serif text-4xl sm:text-6xl text-gray-900 font-normal tracking-tight leading-tight">
                Built for writers.{" "}
                <em className="italic text-purple-600 font-light">
                  Powered by insights.
                </em>
              </h2>
            </div>

            <div className="grid grid-cols-6 max-sm:grid-cols-2 gap-5 h-[62vh] w-full">
              {BENTO_CARDS.map((card, i) => (
                <BentoCard
                  key={card.id}
                  card={card}
                  delay={i * 65}
                  visible={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 3: CTA SPLIT ──────────────────────────────────── */}
        {!access && (
          <section
            ref={ctaRef}
            className="w-full h-screen snap-start grid grid-cols-1 md:grid-cols-[9fr_11fr] border-t border-gray-200 bg-white overflow-hidden shrink-0"
          >
            <div className="bg-[#fcfbfe] px-12 lg:px-20 flex flex-col justify-center h-full border-r border-gray-100">
              <div className="max-w-md w-full flex flex-col gap-6">
                <p className="text-[11px] tracking-[0.35em] uppercase text-purple-700 font-extrabold">
                  Ready to begin?
                </p>
                <h2 className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-gray-900 leading-[1.05]">
                  Your story
                  <br />
                  starts{" "}
                  <em className="italic text-purple-600 font-light">here.</em>
                </h2>
                <p className="text-base text-gray-600 leading-relaxed font-light">
                  Join a dynamic collective of digital authors who chose a
                  quieter, intentional, and distraction-free landscape for their
                  narratives.
                </p>
                <div className="flex flex-row items-center gap-5 pt-4">
                  <button
                    className="bg-[#6a5188] hover:bg-[#584273] text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-md text-sm tracking-wide"
                    onClick={() => navigate("/signup")}
                  >
                    Create your account
                  </button>
                  <button
                    className="text-sm font-bold text-gray-800 hover:text-purple-700 transition-colors py-3 px-2 group tracking-wide"
                    onClick={() => navigate("/login")}
                  >
                    <span className="border-b-2 border-transparent group-hover:border-purple-700 pb-0.5">
                      Sign in
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-12 lg:px-24 flex flex-col justify-center bg-white h-full">
              <div className="max-w-xl w-full divide-y divide-gray-100">
                {CTA_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-6 py-8 first:pt-0 last:pb-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 shrink-0 mt-0.5 shadow-sm">
                      {f.icon}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold text-gray-900 tracking-tight">
                        {f.title}
                      </p>
                      <p className="text-sm text-gray-500 leading-relaxed font-light">
                        {f.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
