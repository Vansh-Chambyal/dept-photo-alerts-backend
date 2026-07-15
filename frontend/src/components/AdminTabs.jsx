import { useNavigate } from "react-router-dom";

const TABS = [
  { path: "/admin/send", label: "Send" },
  { path: "/admin/departments", label: "Departments" },
  { path: "/admin/users", label: "Users" },
];

export default function AdminTabs({ active }) {
  const navigate = useNavigate();
  return (
    <div className="tabs">
      {TABS.map((t) => (
        <button
          key={t.path}
          className={`tab${active === t.path ? " active" : ""}`}
          onClick={() => navigate(t.path)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
