import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  fetchAllPlans,
  fetchPlanStats,
  createPlan,
  updatePlan,
  deletePlan,
} from "../../redux/thunks/adminPlanThunks";
import {
  openModal,
  closeModal,
  setSelectedPlan,
  clearSelectedPlan,
  clearError,
} from "../../redux/slice/adminPlanSlice";
import { confirmAction } from "../../services/modalServices";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Plus: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  Edit: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        strokeLinecap="round"
      />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
      <path
        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        strokeLinecap="round"
      />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  ),
  Eye: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  X: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5"
    >
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  Sort: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3 h-3"
    >
      <path
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        strokeLinecap="round"
      />
    </svg>
  ),
};

// ─── Validation Schema ────────────────────────────────────────────────────────
const planSchema = Yup.object({
  name: Yup.string().min(2).max(60).required("Name is required"),
  description: Yup.string().max(300),
  type: Yup.string().oneOf(["base", "add_on"]).required(),
  price: Yup.number().min(0).required("Price is required"),
  durationDays: Yup.number().min(1).integer().required("Duration is required"),
  interval: Yup.string()
    .oneOf(["monthly", "quarterly", "yearly", "one_time"])
    .required(),
  status: Yup.string().oneOf(["active", "archived", "draft"]).required(),
  "limit.monthlyTokens": Yup.number().min(0),
  "features.aiChat": Yup.boolean(),
  "features.aiSummary": Yup.boolean(),
  "features.writingAssist": Yup.boolean(),
  "features.tagsGeneration": Yup.boolean(),
  "features.analyticsAccess": Yup.boolean(),
});

const EMPTY_PLAN = {
  name: "",
  description: "",
  type: "base",
  price: 0,
  durationDays: 30,
  interval: "monthly",
  status: "active",

  "limit.monthlyTokens": 0,

  "features.aiChat": false,
  "features.aiSummary": false,
  "features.writingAssist": false,
  "features.tagsGeneration": false,
  "features.analyticsAccess": false,
};

function planToFormValues(plan) {
  if (!plan) return EMPTY_PLAN;
  return {
    name: plan.name || "",
    type: plan.type || "",
    description: plan.description || "",
    price: plan.price ?? 0,
    durationDays: plan.durationDays ?? 30,
    interval: plan.interval || "monthly",
    status: plan.status || "active",
    "limit.monthlyTokens": plan.limit?.monthlyTokens ?? 0,
    "features.aiChat": plan.features?.aiChat ?? false,
    "features.aiSummary": plan.features?.aiSummary ?? false,
    "features.writingAssist": plan.features?.writingAssist ?? false,
    "features.tagsGeneration": plan.features?.tagsGeneration ?? false,
    "features.analyticsAccess": plan.features?.analyticsAccess ?? false,
  };
}

function formValuesToPayload(vals) {
  return {
    name: vals.name,
    description: vals.description,
    type: vals.type,
    price: Number(vals.price),
    durationDays: Number(vals.durationDays),
    interval: vals.interval,
    status: vals.status,

    limit: {
      monthlyTokens: Number(vals["limit.monthlyTokens"]),
    },

    features: {
      aiChat: vals["features.aiChat"],
      aiSummary: vals["features.aiSummary"],
      writingAssist: vals["features.writingAssist"],
      tagsGeneration: vals["features.tagsGeneration"],
      analyticsAccess: vals["features.analyticsAccess"],
    },
  };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-lavender flex flex-col gap-1 hover:-translate-y-0.5 transition-transform duration-300">
      <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
        {label}
      </span>
      <span className="text-3xl font-display text-on-surface">
        {value ?? "—"}
      </span>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(38,30,53,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ plan, onClose, onEdit }) {
  if (!plan) return null;
  const features = Object.entries(plan.features || {})
    .filter(([, v]) => v)
    .map(([k]) => k);
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-4xl p-8 max-w-lg w-full shadow-lavender max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-2xl text-on-surface">
              {plan.name}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {plan.slug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon.X />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          {[
            ["Price", `₹${Number(plan.price).toLocaleString("en-IN")}`],
            ["Interval", plan.interval],
            ["Duration", `${plan.durationDays} days`],
            ["Status", plan.status],
          ].map(([l, v]) => (
            <div key={l} className="bg-surface-low rounded-2xl p-3">
              <div className="text-xs text-on-surface-variant mb-0.5">{l}</div>
              <div className="font-bold text-on-surface capitalize">{v}</div>
            </div>
          ))}
        </div>
        {plan.description && (
          <p className="text-sm text-on-surface-variant mb-4 bg-surface-low rounded-2xl p-3">
            {plan.description}
          </p>
        )}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
            limit
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(plan.limit || {}).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between bg-surface-lowest border border-surface-highest rounded-xl p-2"
              >
                <span className="text-on-surface-variant">{k}</span>
                <span className="font-bold text-on-surface">{v}</span>
              </div>
            ))}
          </div>
        </div>
        {features.length > 0 && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              Features
            </p>
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <span
                  key={f}
                  className="status-badge bg-primary-fixed text-primary border border-primary-fixed-dim text-xs"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={onEdit}
          className="btn-editorial mt-2 rounded-full py-3"
        >
          Edit this plan
        </button>
      </div>
    </Overlay>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function PlanFormModal({ plan, onClose, onSuccess, loading }) {
  const dispatch = useDispatch();
  const isEdit = !!plan;

  const formik = useFormik({
    initialValues: planToFormValues(plan),
    validationSchema: planSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const payload = formValuesToPayload(values);
      const result = await dispatch(
        isEdit
          ? updatePlan({ id: plan._id, data: payload })
          : createPlan(payload),
      );
      if (!result.error) onSuccess();
    },
  });

  const F = ({ name, label, type = "text", ...rest }) => {
    const err = formik.touched[name] && formik.errors[name];
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`input-editorial ${err ? "ring-2 ring-red-300" : ""}`}
          {...rest}
        />
        {err && <span className="text-xs text-red-500">{err}</span>}
      </div>
    );
  };

  const Select = ({ name, label, options }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      <select
        name={name}
        value={formik.values[name]}
        onChange={formik.handleChange}
        className="input-editorial"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const Toggle = ({ name, label }) => (
    <label className="flex items-center justify-between bg-surface-low rounded-2xl px-4 py-3 cursor-pointer select-none">
      <span className="text-sm text-on-surface">{label}</span>
      <div
        onClick={() => formik.setFieldValue(name, !formik.values[name])}
        className={`w-10 h-5 rounded-full transition-colors relative ${formik.values[name] ? "bg-primary" : "bg-surface-highest"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formik.values[name] ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </div>
    </label>
  );

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-4xl p-8 max-w-xl w-full shadow-lavender max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl text-on-surface">
            {isEdit ? "Edit Plan" : "New Plan"}
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon.X />
          </button>
        </div>
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <F name="name" label="Name" />
          <F name="description" label="Description" />
          <div className="grid grid-cols-2 gap-4">
            <F
              name="price"
              label="Price (₹)"
              type="number"
              min={0}
              step={0.01}
            />
            <F
              name="durationDays"
              label="Duration (days)"
              type="number"
              min={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
           s

            <Select
              name="interval"
              label="Interval"
              options={["monthly", "quarterly", "yearly", "one_time"]}
              disabled={formik.values.plan == 0}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              limit
            </p>
            <div className="grid grid-cols-1 gap-3">
              <F
                name="limit.monthlyTokens"
                label="Monthly Tokens"
                type="number"
                min={0}
              />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              Features
            </p>
            <div className="flex flex-col gap-2">
              <Toggle name="features.aiChat" label="AI Chat" />
              <Toggle name="features.aiSummary" label="AI Summary" />
              <Toggle name="features.writingAssist" label="Writing Assist" />
              <Toggle name="features.tagsGeneration" label="Tags Generation" />
              <Toggle
                name="features.analyticsAccess"
                label="Analytics Access"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={formik.isSubmitting || loading}
            className="btn-editorial mt-2"
          >
            {formik.isSubmitting || loading
              ? "Saving…"
              : isEdit
                ? "Save Changes"
                : "Create Plan"}
          </button>
        </form>
      </div>
    </Overlay>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPlansPage() {
  const dispatch = useDispatch();
  const {
    plans,
    stats,
    loading,
    statsLoading,
    actionLoading,
    modal,
    selectedPlan,
    error,
  } = useSelector((s) => s.adminPlans);

  const [globalFilter, setGlobalFilter] = useState("");
  const [viewPlan, setViewPlan] = useState(null);
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    dispatch(fetchAllPlans());
    dispatch(fetchPlanStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ─── Delete with SweetAlert2 ──────────────────────────────────────────────
  const handleDelete = async (plan) => {
    const { isConfirmed } = await confirmAction(
      "Delete Plan?",
      `"${plan.name}" will be soft-deleted and archived. This cannot be undone.`,
      "warning",
      "Delete",
    );
    if (!isConfirmed) return;
    const res = await dispatch(deletePlan(plan._id));
    if (!res.error) dispatch(fetchPlanStats());
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Plan",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-on-surface">{row.original.name}</div>
            <div className="text-xs text-on-surface-variant">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ getValue }) => (
          <span className="font-display text-base text-primary">
            ₹{getValue().toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "interval",
        header: "Interval",
        cell: ({ getValue }) => (
          <span className="capitalize text-xs text-on-surface-variant">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const v = getValue();
          const cls =
            v === "active"
              ? "status-verified"
              : v === "draft"
                ? "status-pending"
                : "bg-surface-highest text-on-surface-variant border border-surface-highest";
          return <span className={`status-badge ${cls}`}>{v}</span>;
        },
      },
      {
        id: "features",
        header: "Features",
        cell: ({ row }) => {
          const count = Object.values(row.original.features || {}).filter(
            Boolean,
          ).length;
          const total = Object.keys(row.original.features || {}).length;

          return (
            <span className="text-xs font-bold text-primary">
              {count} / {total}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => setViewPlan(row.original)}
              className="p-2 rounded-xl hover:bg-surface-low text-on-surface-variant hover:text-primary transition-colors"
            >
              <Icon.Eye />
            </button>
            <button
              onClick={() => {
                dispatch(setSelectedPlan(row.original));
                dispatch(openModal("edit"));
              }}
              className="p-2 rounded-xl hover:bg-surface-low text-on-surface-variant hover:text-primary transition-colors"
            >
              <Icon.Edit />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              disabled={actionLoading}
              className="p-2 rounded-xl hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <Icon.Trash />
            </button>
          </div>
        ),
      },
    ],
    [dispatch, actionLoading], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const table = useReactTable({
    data: plans,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const ov = stats?.overview;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">
            Admin
          </p>
          <h1 className="font-display text-4xl text-on-surface">Plans</h1>
        </div>
        <button
          onClick={() => {
            dispatch(clearSelectedPlan());
            dispatch(openModal("create"));
          }}
          className="btn-editorial w-auto px-6 py-3 rounded-full text-sm"
        >
          <Icon.Plus /> New Plan
        </button>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-24 bg-surface-high rounded-3xl" />
            ))}
        </div>
      ) : (
        ov && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Plans" value={ov.total} />
            <StatCard label="Active" value={ov.totalActive} />
            <StatCard label="Paid" value={ov.totalPaid} />
            <StatCard label="Free" value={ov.totalFree} />
            {/* <StatCard
              label="Avg Price"
              value={`₹${Math.round(ov.avgPrice ?? 0).toLocaleString("en-IN")}`}
            />  <StatCard
              label="Max Price"
              value={`₹${Number(ov.maxPrice ?? 0).toLocaleString("en-IN")}`}
            /> */}
            <StatCard
              label="Deleted"
              value={ov.totalDeleted}
              sub="soft-deleted"
            />
            {/*  <StatCard
              label="Avg Duration"
              value={`${Math.round(ov.avgDurationDays ?? 0)}d`}
            /> */}
          </div>
        )
      )}

      {/* Feature adoption */}
      {/* {stats?.featureAdoption?.features && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.featureAdoption.features).map(
            ([k, { rate }]) => (
              <div
                key={k}
                className="bg-white border border-black/5 rounded-2xl px-4 py-2 shadow-lavender flex items-center gap-2"
              >
                <div className="w-14 h-1.5 rounded-full bg-surface-highest overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-on-surface-variant capitalize">
                  {k}
                </span>
                <span className="text-xs text-primary font-bold">{rate}%</span>
              </div>
            ),
          )}
        </div>
      )} */}

      {/* Table */}
      <div className="table-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-2">
          <h2 className="font-display text-xl text-on-surface">All Plans</h2>
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search plans…"
            className="input-editorial max-w-xs text-sm py-2"
          />
        </div>
        {loading ? (
          <div className="p-10 text-center text-on-surface-variant text-sm">
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="table-header-cell cursor-pointer select-none"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                          {h.column.getCanSort() && <Icon.Sort />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="table-body-cell text-center text-on-surface-variant py-12"
                    >
                      No plans found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-low/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="table-body-cell">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewPlan && (
        <ViewModal
          plan={viewPlan}
          onClose={() => setViewPlan(null)}
          onEdit={() => {
            dispatch(setSelectedPlan(viewPlan));
            dispatch(openModal("edit"));
            setViewPlan(null);
          }}
        />
      )}

      {/* Create / Edit Modal */}
      {modal.isOpen && (modal.type === "create" || modal.type === "edit") && (
        <PlanFormModal
          plan={modal.type === "edit" ? selectedPlan : null}
          loading={actionLoading}
          onClose={() => {
            dispatch(closeModal());
            dispatch(clearSelectedPlan());
          }}
          onSuccess={() => {
            dispatch(fetchAllPlans());
            dispatch(fetchPlanStats());
            dispatch(closeModal());
            dispatch(clearSelectedPlan());
          }}
        />
      )}
    </div>
  );
}
