import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { AlignLeft, ChevronDown } from "lucide-react";

function buildHeadingTree(headings) {
  if (!headings?.length) return [];
  const root = { children: [] };
  const stack = [{ node: root, level: 0 }];
  headings.forEach((h) => {
    const node = { ...h, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].level >= h.level)
      stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, level: h.level });
  });
  return root.children;
}

function flattenIds(nodes, acc = []) {
  nodes.forEach((n) => {
    acc.push(n.id);
    if (n.children?.length) flattenIds(n.children, acc);
  });
  return acc;
}

// ── Single TOC item (recursive) ──────────────────────────────────────────────
const TocNode = ({ node, depth, activeId, onSelect }) => {
  const isActive = activeId === node.id;
  const hasChildren = node.children?.length > 0;

  const childIsActive = useMemo(() => {
    const check = (nodes) =>
      nodes.some(
        (n) => n.id === activeId || (n.children?.length && check(n.children)),
      );
    return check(node.children || []);
  }, [node.children, activeId]);

  return (
    <li className="m-0 p-0">
      <button
        type="button"
        data-toc-id={node.id}
        onClick={() => onSelect(node.id)}
        className={`block w-full text-left rounded-lg leading-[1.5] break-words whitespace-normal cursor-pointer transition-colors duration-150
          ${depth === 0 ? "px-2.5 py-2 text-[15px]" : "px-2.5 py-1.5 text-sm"}
          ${
            isActive
              ? "bg-primary/8 text-primary font-medium"
              : childIsActive
                ? "text-on-surface font-normal"
                : "text-on-surface-variant font-normal"
          }`}
      >
        {node.text}
      </button>

      {hasChildren && (
        <ul
          className="list-none mt-0.5 mb-0 flex flex-col gap-px"
          style={{ paddingLeft: `${Math.min((depth + 1) * 14, 42)}px` }}
        >
          {node.children.map((child) => (
            <TocNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const TableOfContents = ({ headings }) => {
  const [activeId, setActiveId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);

  const navRef = useRef(null);
  const observerRef = useRef(null);
  const mobileBarRef = useRef(null);

  const tree = useMemo(() => buildHeadingTree(headings), [headings]);
  const allIds = useMemo(() => flattenIds(tree), [tree]);
  const allIdsKey = allIds.join("|");

  // ── Scrollspy ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!allIds.length) return;

    const elements = allIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!elements.length) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-8% 0px -72% 0px", threshold: 0 },
    );

    elements.forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, [allIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Floating dot navbar: show once the top TOC bar scrolls out of view ──────
  useEffect(() => {
    const el = mobileBarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolledPast(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Keep active item in view inside the sidebar (no page scroll) ────────────
  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const el = navRef.current.querySelector(`[data-toc-id="${activeId}"]`);
    if (!el) return;
    const nav = navRef.current;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const isAbove = elRect.top < navRect.top + 8;
    const isBelow = elRect.bottom > navRect.bottom - 8;
    if (isAbove || isBelow) {
      nav.scrollBy({
        top: elRect.top - navRect.top - navRect.height / 2 + elRect.height / 2,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const handleSelect = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setMobileOpen(false);
    setSideNavOpen(false);
  }, []);

  if (!headings?.length) return null;

  const activeText = headings.find((h) => h.id === activeId)?.text;

  const tocList = (
    <ul className="list-none m-0 p-0 flex flex-col gap-px">
      {tree.map((node) => (
        <TocNode
          key={node.id}
          node={node}
          depth={0}
          activeId={activeId}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="hidden xl:block sticky top-28 w-50 shrink-0 self-start overflow-visible"
        aria-label="Table of contents"
      >s
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant/60">
          Contents
        </p>
        {tocList}
      </nav>

      {/* ── Mobile: inline expandable list ──────────────────────────────────── */}
      <div className="xl:hidden mb-6 " ref={mobileBarRef}>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          className={`flex w-full items-center gap-2 border border-primary/15 bg-surface-low px-3.5 py-2 text-[13px] font-medium text-primary cursor-pointer transition-all duration-150
      ${mobileOpen ? "rounded-t-[14px] rounded-b-none" : "rounded-full"}`}
          aria-label="Toggle table of contents"
        >
          <AlignLeft size={14} className="shrink-0" />
          <span className="flex-1 truncate text-left">
            {activeText || "Contents"}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform duration-200 ${mobileOpen ? "rotate-180" : "rotate-0"}`}
          />
        </button>

        <div
          className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: mobileOpen ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`rounded-b-[14px] border border-t-0 border-primary/15 bg-surface-lowest px-3 py-2.5 transition-opacity duration-200
          ${mobileOpen ? "opacity-100 delay-100" : "opacity-0"}`}
            >
              {tocList}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: floating jump-nav, appears once scrolled down */}
      <div
        className={`xl:hidden fixed right-1.5 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 transition-opacity duration-300
    ${scrolledPast && !mobileOpen && tree.length > 1 ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {/* Expanded label panel */}
        <div
          className={`overflow-hidden rounded-xl border border-primary/15 bg-surface-lowest shadow-md transition-all duration-200
      ${sideNavOpen ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"}`}
        >
          <ul className="list-none m-0 flex flex-col gap-0.5 p-1.5 whitespace-nowrap">
            {tree.map((node) => {
              const isActive =
                activeId === node.id ||
                flattenIds(node.children || []).includes(activeId);
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelect(node.id);
                      setSideNavOpen(false);
                    }}
                    className={`block w-full truncate rounded-md px-2 py-1 text-left text-xs transition-colors duration-150
                ${isActive ? "bg-primary/8 text-primary font-medium" : "text-on-surface-variant"}`}
                  >
                    {node.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Dot strip / toggle handle */}
        <button
          type="button"
          onClick={() => setSideNavOpen((o) => !o)}
          aria-label="Toggle section jump nav"
          aria-expanded={sideNavOpen}
          className="flex shrink-0 flex-col items-center gap-2 rounded-full border border-primary/15 bg-surface-low px-1.5 py-2.5 shadow-sm"
        >
          {tree.map((node) => {
            const isActive =
              activeId === node.id ||
              flattenIds(node.children || []).includes(activeId);
            return (
              <span
                key={node.id}
                className={`block h-1.5 w-1.5 rounded-full transition-all duration-150
            ${isActive ? "bg-primary scale-125" : "bg-on-surface-variant/30"}`}
              />
            );
          })}
        </button>
      </div>
    </>
  );
};

export default TableOfContents;
