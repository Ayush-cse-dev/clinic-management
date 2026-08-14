import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { IconPlus } from "../components/icons";

const EMPTY_FORM = {
  patient_id: "",
  doctor_id: "",
  diagnosis: "",
  treatment: "",
  notes: "",
  record_date: "",
};

export default function MedicalRecords() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canAdd = user?.role === "admin" || user?.role === "doctor";

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [myDoctorId, setMyDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/medical-records");
      setRecords(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not load medical records."), "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!canAdd) return;
    api
      .get("/patients")
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]));

    if (user?.role === "doctor") {
      api
        .get("/doctors/me")
        .then((res) => setMyDoctorId(res.data.id))
        .catch(() => setMyDoctorId(null));
    }
  }, [canAdd, user?.role]);

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

    const doctorId = user?.role === "doctor" ? myDoctorId : Number(form.doctor_id);
    if (!doctorId) {
      setFormError(
        user?.role === "doctor"
          ? "Your account isn't linked to a doctor record yet."
          : "Please select a doctor."
      );
      return;
    }

    setSaving(true);
    try {
      await api.post("/medical-records", {
        ...form,
        patient_id: Number(form.patient_id),
        doctor_id: doctorId,
      });
      showToast("Medical record added.", "success");
      setModalOpen(false);
      loadRecords();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not add medical record."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Care"
        title="Medical Records"
        subtitle={
          user?.role === "patient" ? "Your diagnosis and treatment history." : "Patient diagnosis and treatment history."
        }
        actions={
          canAdd && (
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <IconPlus className="btn-icon" />
              Add record
            </button>
          )
        }
      />

      {loading && <Spinner />}

      {!loading && records.length === 0 && (
        <EmptyState title="No medical records yet" message="Records will appear here once added." />
      )}

      {!loading && records.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.record_date}</td>
                  <td className="cell-primary">{r.diagnosis}</td>
                  <td>{r.treatment || <span className="cell-muted">&mdash;</span>}</td>
                  <td>{r.notes || <span className="cell-muted">&mdash;</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title="Add medical record"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="record-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save record"}
              </button>
            </>
          }
        >
          <form id="record-form" onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}

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

            <div className="field-row">
              <div className="field">
                <label htmlFor="diagnosis">Diagnosis</label>
                <input
                  id="diagnosis"
                  className="input"
                  required
                  value={form.diagnosis}
                  onChange={handleFieldChange("diagnosis")}
                />
              </div>
              <div className="field">
                <label htmlFor="record_date">Date</label>
                <input
                  id="record_date"
                  type="date"
                  className="input"
                  required
                  value={form.record_date}
                  onChange={handleFieldChange("record_date")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="treatment">Treatment</label>
              <textarea
                id="treatment"
                className="textarea"
                value={form.treatment}
                onChange={handleFieldChange("treatment")}
              />
            </div>

            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" className="textarea" value={form.notes} onChange={handleFieldChange("notes")} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
