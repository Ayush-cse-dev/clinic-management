import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { IconPlus } from "../components/icons";

const EMPTY_FORM = { appointment_id: "", medicines: "", instructions: "" };

export default function Prescriptions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canPrescribe = user?.role === "admin" || user?.role === "doctor";

  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/prescriptions");
      setPrescriptions(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not load prescriptions."), "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadPrescriptions();
  }, [loadPrescriptions]);

  useEffect(() => {
    if (!canPrescribe) return;
    api
      .get("/appointments", { params: { status: "completed" } })
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]));
  }, [canPrescribe]);

  const openAddModal = () => {
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
    setSaving(true);
    try {
      await api.post("/prescriptions", {
        ...form,
        appointment_id: Number(form.appointment_id),
      });
      showToast("Prescription added.", "success");
      setModalOpen(false);
      loadPrescriptions();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not add prescription."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Care"
        title="Prescriptions"
        subtitle={
          user?.role === "patient"
            ? "Medicines prescribed to you."
            : "Prescriptions written for completed appointments."
        }
        actions={
          canPrescribe && (
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <IconPlus className="btn-icon" />
              Add prescription
            </button>
          )
        }
      />

      {loading && <Spinner />}

      {!loading && prescriptions.length === 0 && (
        <EmptyState title="No prescriptions yet" message="Prescriptions will appear here once added." />
      )}

      {!loading && prescriptions.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Medicines</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{p.medicines}</td>
                  <td>{p.instructions || <span className="cell-muted">&mdash;</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title="Add prescription"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="prescription-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save prescription"}
              </button>
            </>
          }
        >
          <form id="prescription-form" onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}

            <div className="field">
              <label htmlFor="appointment_id">Completed appointment</label>
              <select
                id="appointment_id"
                className="input"
                required
                value={form.appointment_id}
                onChange={handleFieldChange("appointment_id")}
              >
                <option value="">Select an appointment</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.appointment_date} &mdash; {a.patient?.full_name || `Patient #${a.patient_id}`}
                  </option>
                ))}
              </select>
              {appointments.length === 0 && (
                <span className="field-hint">
                  No completed appointments available yet. Mark an appointment as completed first.
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="medicines">Medicines</label>
              <textarea
                id="medicines"
                className="textarea"
                required
                placeholder="One per line, e.g.&#10;Amoxicillin 500mg &mdash; 3x daily for 7 days"
                value={form.medicines}
                onChange={handleFieldChange("medicines")}
              />
            </div>

            <div className="field">
              <label htmlFor="instructions">Instructions</label>
              <textarea
                id="instructions"
                className="textarea"
                value={form.instructions}
                onChange={handleFieldChange("instructions")}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
