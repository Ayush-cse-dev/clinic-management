import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { IconPlus } from "../components/icons";

const EMPTY_FORM = {
  patient_id: "",
  doctor_id: "",
  appointment_date: "",
  appointment_time: "",
  reason: "",
};

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

export default function Appointments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canBookForOthers = user?.role === "admin" || user?.role === "receptionist";
  const canChangeStatus = user?.role === "admin" || user?.role === "receptionist" || user?.role === "doctor";

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [myPatientId, setMyPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAppointments = useCallback(
    async (filterStatus) => {
      setLoading(true);
      try {
        const res = await api.get("/appointments", {
          params: filterStatus ? { status: filterStatus } : {},
        });
        setAppointments(res.data);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not load appointments."), "danger");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const loadReferenceData = useCallback(async () => {
    try {
      const canSeeAllPatients = user?.role === "admin" || user?.role === "receptionist";
      const [doctorsRes, patientsRes] = await Promise.all([
        api.get("/doctors"),
        canSeeAllPatients ? api.get("/patients") : Promise.resolve({ data: [] }),
      ]);
      setDoctors(doctorsRes.data);
      setPatients(patientsRes.data);

      if (user?.role === "patient") {
        try {
          const meRes = await api.get("/patients/me");
          setMyPatientId(meRes.data.id);
        } catch {
          setMyPatientId(null);
        }
      }
    } catch {
      // Reference data is only needed for the booking form; a silent
      // failure here shouldn't block the appointments list from showing.
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadAppointments(statusFilter);
  }, [loadAppointments, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadReferenceData();
  }, [loadReferenceData]);

  const openBookModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const handleFieldChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const patientId = canBookForOthers ? Number(form.patient_id) : myPatientId;
    if (!patientId) {
      setFormError(
        canBookForOthers
          ? "Please select a patient."
          : "Your account isn't linked to a patient record yet. Ask the front desk to link your login."
      );
      return;
    }

    setSaving(true);
    try {
      await api.post("/appointments", {
        ...form,
        patient_id: patientId,
        doctor_id: Number(form.doctor_id),
      });
      showToast("Appointment booked.", "success");
      setModalOpen(false);
      loadAppointments(statusFilter);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not book appointment."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      await api.put(`/appointments/${appointment.id}`, { status: newStatus });
      showToast(`Appointment marked as ${newStatus}.`, "success");
      setAppointments((current) =>
        current.map((a) => (a.id === appointment.id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      showToast(getErrorMessage(err, "Could not update appointment."), "danger");
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        subtitle={
          user?.role === "patient"
            ? "View and book your appointments."
            : user?.role === "doctor"
            ? "Your upcoming and past appointments."
            : "Book and manage appointments across the clinic."
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={openBookModal}>
            <IconPlus className="btn-icon" />
            Book appointment
          </button>
        }
      />

      <div className="tabs">
        {["", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || "all"}
            type="button"
            className={`tab${statusFilter === s ? " active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && appointments.length === 0 && (
        <EmptyState title="No appointments" message="Nothing here yet. Book one to get started." />
      )}

      {!loading && appointments.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Status</th>
                {canChangeStatus && <th></th>}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.appointment_date}</td>
                  <td>{appt.appointment_time}</td>
                  <td>{appt.patient?.full_name || `#${appt.patient_id}`}</td>
                  <td>Dr. {appt.doctor?.full_name || appt.doctor_id}</td>
                  <td>{appt.reason || <span className="cell-muted">&mdash;</span>}</td>
                  <td>
                    <Badge status={appt.status} />
                  </td>
                  {canChangeStatus && (
                    <td className="row-actions">
                      <select
                        className="input"
                        style={{ minWidth: 130 }}
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title="Book appointment"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="appointment-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Booking..." : "Book appointment"}
              </button>
            </>
          }
        >
          <form id="appointment-form" onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}

            {canBookForOthers && (
              <div className="field">
                <label htmlFor="patient_id">Patient</label>
                <select
                  id="patient_id"
                  className="input"
                  required
                  value={form.patient_id}
                  onChange={handleFieldChange("patient_id")}
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="field">
              <label htmlFor="doctor_id">Doctor</label>
              <select
                id="doctor_id"
                className="input"
                required
                value={form.doctor_id}
                onChange={handleFieldChange("doctor_id")}
              >
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.full_name} &mdash; {d.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="appointment_date">Date</label>
                <input
                  id="appointment_date"
                  type="date"
                  className="input"
                  required
                  value={form.appointment_date}
                  onChange={handleFieldChange("appointment_date")}
                />
              </div>
              <div className="field">
                <label htmlFor="appointment_time">Time</label>
                <input
                  id="appointment_time"
                  type="time"
                  className="input"
                  required
                  value={form.appointment_time}
                  onChange={handleFieldChange("appointment_time")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="reason">Reason for visit</label>
              <textarea
                id="reason"
                className="textarea"
                value={form.reason}
                onChange={handleFieldChange("reason")}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
