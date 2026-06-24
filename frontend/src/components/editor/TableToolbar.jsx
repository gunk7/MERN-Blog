import React, { useState, useRef, useEffect } from "react";
import { Trash2, Merge, Split, ChevronDown, GripVertical } from "lucide-react";

// ── Grid picker constants ─────────────────────────────────────────────────────
const MAX_ROWS = 8;
const MAX_COLS = 8;

// ── Small toolbar button ──────────────────────────────────────────────────────
const TBtn = ({
  onClick,
  title,
  children,
  danger = false,
  disabled = false,
}) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault();
      if (!disabled) onClick();
    }}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                transition-all whitespace-nowrap
      ${
        danger
          ? "text-red-400 hover:bg-red-50"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }
      ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

const TSep = () => <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />;

// ── Table Grid Picker ─────────────────────────────────────────────────────────
export const TableGridPicker = ({ onSelect, onClose }) => {
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border
                 border-slate-200 rounded-2xl shadow-2xl p-3"
    >
      <p className="text-xs text-slate-500 mb-2.5 text-center font-medium">
        {hovered.rows > 0 && hovered.cols > 0
          ? `${hovered.rows} × ${hovered.cols} Table`
          : "Select table size"}
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1.25rem)` }}
      >
        {Array.from({ length: MAX_ROWS }).map((_, r) =>
          Array.from({ length: MAX_COLS }).map((_, c) => {
            const isActive = r < hovered.rows && c < hovered.cols;
            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => setHovered({ rows: r + 1, cols: c + 1 })}
                onMouseLeave={() => setHovered({ rows: 0, cols: 0 })}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(r + 1, c + 1);
                }}
                className={`w-5 h-5 rounded-sm border cursor-pointer transition-all
                  ${
                    isActive
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-slate-100 border-slate-200 hover:border-slate-300"
                  }`}
              />
            );
          }),
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-2.5 text-center">Max 8 × 8</p>
    </div>
  );
};

// ── Table Toolbar Component ───────────────────────────────────────────────────
const TableToolbar = ({ editor, containerRef }) => {
  const [showBatchRow, setShowBatchRow] = useState(false);
  const [showBatchCol, setShowBatchCol] = useState(false);
  const [batchRowCount, setBatchRowCount] = useState(2);
  const [batchColCount, setBatchColCount] = useState(2);
  const [position, setPosition] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Ref mirrors expanded state so the selection update callback
  // (which closes over a stale closure) can read the live value.
  const expandedRef = useRef(false);
  const toolbarRef = useRef(null);

  const setExpandedSynced = (val) => {
    expandedRef.current = val;
    setExpanded(val);
  };

  // ── Selection-based show/hide ─────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      // While the expanded menu is open, never hide — the user is interacting.
      if (expandedRef.current) return;

      if (!editor.isActive("table")) {
        // Cursor left the table — remove highlight and hide toolbar.
        editor.view.dom
          .querySelectorAll("table.is-active-table")
          .forEach((t) => {
            t.classList.remove("is-active-table");
          });
        setPosition(null);
        return;
      }

      // Find the exact <table> element the cursor is inside.
      const { from } = editor.state.selection;
      const domInfo = editor.view.domAtPos(from);
      const node = domInfo.node;
      const tableEl =
        node.nodeType === 1
          ? (node.closest?.("table") ?? null)
          : (node.parentElement?.closest("table") ?? null);

      if (!tableEl || !containerRef?.current) return;

      // Highlight this table, un-highlight any others.
      editor.view.dom.querySelectorAll("table.is-active-table").forEach((t) => {
        if (t !== tableEl) t.classList.remove("is-active-table");
      });
      tableEl.classList.add("is-active-table");

      // Position toolbar relative to the containerRef wrapper.
      const containerRect = containerRef.current.getBoundingClientRect();
      const tableRect = tableEl.getBoundingClientRect();
      setPosition({
        top: tableRect.top - containerRect.top + containerRef.current.scrollTop,
        left: tableRect.left - containerRect.left,
      });
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor, containerRef]);

  // ── Close expanded menu on outside click ─────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setExpandedSynced(false);
        setShowBatchRow(false);
        setShowBatchCol(false);
      }
    };
    // Delay so the mousedown that opened it doesn't immediately close it.
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      0,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [expanded]);

  if (!editor || !position) return null;

  // ── Batch helpers ─────────────────────────────────────────────────────────
  const insertBatchRows = (pos) => {
    for (let i = 0; i < batchRowCount; i++) {
      if (pos === "above") editor.chain().focus().addRowBefore().run();
      else editor.chain().focus().addRowAfter().run();
    }
    setShowBatchRow(false);
  };

  const insertBatchCols = (pos) => {
    for (let i = 0; i < batchColCount; i++) {
      if (pos === "left") editor.chain().focus().addColumnBefore().run();
      else editor.chain().focus().addColumnAfter().run();
    }
    setShowBatchCol(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={toolbarRef}
      style={{
        position: "absolute",
        top: position.top - 32,
        left: position.left + 6,
        zIndex: 100,
      }}
      onMouseDown={(e) => e.preventDefault()}
      className="pointer-events-auto"
    >
      {!expanded ? (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setExpandedSynced(true);
          }}
          title="Table options"
          className="flex items-center justify-center w-6 h-6 rounded-md
                     bg-purple-600 text-white border border-purple-400
                     hover:bg-purple-700 transition-all shadow-md active:scale-95"
        >
          <GripVertical size={13} />
        </button>
      ) : (
        <div
          style={{ transform: "translateY(-100%)" }}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center gap-0.5 px-2 py-1.5 bg-white/95 backdrop-blur-md
                     border border-slate-200 rounded-xl shadow-2xl flex-wrap max-w-xl mb-2"
        >
          {/* ── Row controls ── */}
          <TBtn
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="Add row above"
          >
            ↑ Row
          </TBtn>
          <TBtn
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add row below"
          >
            ↓ Row
          </TBtn>

          {/* Batch row insert */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowBatchRow((p) => !p);
                setShowBatchCol(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-all"
            >
              Rows <ChevronDown size={11} />
            </button>
            {showBatchRow && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 min-w-36">
                <p className="text-[10px] text-slate-500 mb-2">Insert rows</p>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={batchRowCount}
                  onChange={(e) => setBatchRowCount(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded-lg bg-white text-slate-900 text-xs border border-slate-300 focus:outline-none mb-2"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertBatchRows("above");
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition-all"
                  >
                    Above
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertBatchRows("below");
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition-all"
                  >
                    Below
                  </button>
                </div>
              </div>
            )}
          </div>

          <TBtn
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete row"
            danger
          >
            <Trash2 size={12} /> Row
          </TBtn>

          <TSep />

          {/* ── Column controls ── */}
          <TBtn
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Add column left"
          >
            ← Col
          </TBtn>
          <TBtn
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add column right"
          >
            → Col
          </TBtn>

          {/* Batch col insert */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowBatchCol((p) => !p);
                setShowBatchRow(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cols <ChevronDown size={11} />
            </button>
            {showBatchCol && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 min-w-36">
                <p className="text-[10px] text-slate-500 mb-2">
                  Insert columns
                </p>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={batchColCount}
                  onChange={(e) => setBatchColCount(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded-lg bg-white text-slate-900 text-xs border border-slate-300 focus:outline-none mb-2"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertBatchCols("left");
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition-all"
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertBatchCols("right");
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition-all"
                  >
                    Right
                  </button>
                </div>
              </div>
            )}
          </div>

          <TBtn
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete column"
            danger
          >
            <Trash2 size={12} /> Col
          </TBtn>

          <TSep />

          {/* ── Cell controls ── */}
          <TBtn
            onClick={() => editor.chain().focus().mergeCells().run()}
            title="Merge selected cells"
            disabled={!editor.can().mergeCells()}
          >
            <Merge size={12} /> Merge
          </TBtn>
          <TBtn
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split cell"
            disabled={!editor.can().splitCell()}
          >
            <Split size={12} /> Split
          </TBtn>

          <TSep />

          {/* ── Delete table ── */}
          <TBtn
            onClick={() => {
              editor.chain().focus().deleteTable().run();
              setExpandedSynced(false);
            }}
            title="Delete table"
            danger
          >
            <Trash2 size={12} /> Table
          </TBtn>
        </div>
      )}
    </div>
  );
};

export default TableToolbar;
