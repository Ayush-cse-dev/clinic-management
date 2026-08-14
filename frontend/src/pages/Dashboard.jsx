import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";

const ENDPOINT_BY_ROLE = {
  admin: "/dashboard/admin",
  receptionist: "/dashboard/admin",
  doctor: "/dashboard/doctor",
  patient: "/dashboard/patient",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function AdminStats({ data }) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-card-label">Total patients</div>
        <div className="stat-card-value">{data.total_patients}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Total doctors</div>
        <div className="stat-card-value">{data.total_doctors}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Today&apos;s appointments</div>
        <div className="stat-card-value">{data.todays_appointments}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Pending appointments</div>
        <div className="stat-card-value">{data.pending_appointments}</div>
        <div className="stat-card-hint">{data.completed_appointments} completed overall</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Revenue collected</div>
        <div className="stat-card-value">{formatCurrency(data.total_revenue)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Revenue pending</div>
        <div className="stat-card-value">{formatCurrency(data.pending_revenue)}</div>
      </div>
    </div>
  );
}

function DoctorStats({ data }) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-card-label">Today&apos;s appointments</div>
        <div className="stat-card-value">{data.todays_appointments}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Upcoming appointments</div>
        <div className="stat-card-value">{data.upcoming_appointments}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Patients seen</div>
        <div className="stat-card-value">{data.total_patients_seen}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Awaiting confirmation</div>
        <div className="stat-card-value">{data.pending_appointments}</div>
      </div>
    </div>
  );
}

function PatientStats({ data }) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-card-label">Upcoming appointments</div>
        <div className="stat-card-value">{data.upcoming_appointments}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Total appointments</div>
        <div className="stat-card-value">{data.total_appointments}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Prescriptions on file</div>
        <div className="stat-card-value">{data.total_prescriptions}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Bills pending</div>
        <div className="stat-card-value">{data.pending_bills}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Unread notifications</div>
        <div className="stat-card-value">{data.unread_notifications}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      const endpoint = ENDPOINT_BY_ROLE[user?.role];
      if (!endpoint) return;
      try {
        const res = await api.get(endpoint);
        if (isMounted) setData(res.data);
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setNotLinked(true);
        } else {
          showToast(getErrorMessage(err, "Could not load your dashboard."), "danger");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  return (
    <div className="content">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || ""}`}
        subtitle="Here's what's happening across the clinic today."
      />

      {loading && <Spinner />}

      {!loading && notLinked && (
        <div className="card card-padded">
          <h3>No linked profile yet</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Your account isn&apos;t linked to a {user?.role} record yet. Ask
            an administrator or receptionist to link your login when they
            create or edit your {user?.role} profile.
          </p>
        </div>
      )}

      {!loading && !notLinked && data && user?.role === "patient" && <PatientStats data={data} />}
      {!loading && !notLinked && data && user?.role === "doctor" && <DoctorStats data={data} />}
      {!loading && !notLinked && data && (user?.role === "admin" || user?.role === "receptionist") && (
        <AdminStats data={data} />
      )}
    </div>
  );
}
