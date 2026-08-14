import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import PulseMark from "./PulseMark";
import {
  IconDashboard,
  IconPatients,
  IconDoctors,
  IconCalendar,
  IconPrescription,
  IconRecord,
  IconBilling,
  IconDocument,
  IconBell,
  IconLogout,
} from "./icons";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: IconDashboard, roles: ["admin", "receptionist", "doctor", "patient"] },
  { to: "/patients", label: "Patients", icon: IconPatients, roles: ["admin", "receptionist", "doctor"] },
  { to: "/doctors", label: "Doctors", icon: IconDoctors, roles: ["admin", "receptionist", "doctor", "patient"] },
  { to: "/appointments", label: "Appointments", icon: IconCalendar, roles: ["admin", "receptionist", "doctor", "patient"] },
  { to: "/prescriptions", label: "Prescriptions", icon: IconPrescription, roles: ["admin", "doctor", "patient"] },
  { to: "/medical-records", label: "Medical Records", icon: IconRecord, roles: ["admin", "doctor", "patient"] },
  { to: "/billing", label: "Billing", icon: IconBilling, roles: ["admin", "receptionist", "patient"] },
  { to: "/documents", label: "Documents", icon: IconDocument, roles: ["admin", "receptionist", "doctor", "patient"] },
  { to: "/notifications", label: "Notifications", icon: IconBell, roles: ["admin", "receptionist", "doctor", "patient"] },
];

function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <PulseMark width={30} height={22} stroke="#E96A4C" />
          <div>
            <div className="sidebar-brand-name">Vela</div>
            <span className="sidebar-brand-tag">Clinic OS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <item.icon className="sidebar-link-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initialsFor(user?.full_name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.full_name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm sidebar-logout" onClick={handleLogout}>
            <IconLogout className="btn-icon" />
            Log out
          </button>
        </div>
      </aside>

      <div className="main-column">
        <Outlet />
      </div>
    </div>
  );
}
