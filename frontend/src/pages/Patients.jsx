import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { IconPlus, IconSearch, IconTrash } from "../components/icons";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  blood_group: "",
  address: "",
  emergency_contact: "",
  create_login: false,
  password: "",
};

export default function Patients() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = user?.role === "admin" || user?.role === "receptionist";

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPatients = useCallback(
    async (query) => {
      setLoading(true);
      try {
        const res = await api.get("/patients", { params: query ? { search: query } : {} });
        setPatients(res.data);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not load patients."), "danger");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadPatients();
  }, [loadPatients]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadPatients(search);
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const handleFieldChange = (field) => (event) => {
    const value = field === "create_login" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (form.create_login && (!form.email || !form.password)) {
      setFormError("Email and password are required to create a login for this patient.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.create_login) {
        delete payload.password;
      }
      await api.post("/patients", payload);
      showToast("Patient added successfully.", "success");
      setModalOpen(false);
      loadPatients(search);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not add patient."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`Remove ${patient.full_name} from patient records?`)) return;
    try {
      await api.delete(`/patients/${patient.id}`);
      showToast("Patient removed.", "success");
      setPatients((current) => current.filter((p) => p.id !== patient.id));
    } catch (err) {
      showToast(getErrorMessage(err, "Could not remove patient."), "danger");
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Directory"
        title="Patients"
        subtitle="Search and manage patient records."
        actions={
          canManage && (
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <IconPlus className="btn-icon" />
              Add patient
            </button>
          )
        }
      />

      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: 1 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <IconSearch
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              className="input search-input"
              placeholder="Search by name, phone, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-ghost">
            Search
          </button>
        </form>
      </div>

      {loading && <Spinner />}

      {!loading && patients.length === 0 && (
        <EmptyState
          title="No patients found"
          message="Try a different search, or add a new patient to get started."
        />
      )}

      {!loading && patients.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Blood group</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="cell-primary">{patient.full_name}</td>
                  <td>{patient.phone || <span className="cell-muted">&mdash;</span>}</td>
                  <td>{patient.email || <span className="cell-muted">&mdash;</span>}</td>
                  <td>{patient.gender || <span className="cell-muted">&mdash;</span>}</td>
                  <td>{patient.blood_group || <span className="cell-muted">&mdash;</span>}</td>
                  {canManage && (
                    <td className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(patient)}
                        aria-label={`Remove ${patient.full_name}`}
                      >
                        <IconTrash />
                      </button>
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
          title="Add patient"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="patient-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save patient"}
              </button>
            </>
          }
        >
          <form id="patient-form" onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}

            <div className="field-row">
              <div className="field">
                <label htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  className="input"
                  required
                  value={form.full_name}
                  onChange={handleFieldChange("full_name")}
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={form.phone} onChange={handleFieldChange("phone")} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={handleFieldChange("email")}
                />
              </div>
              <div className="field">
                <label htmlFor="date_of_birth">Date of birth</label>
                <input
                  id="date_of_birth"
                  type="date"
                  className="input"
                  value={form.date_of_birth}
                  onChange={handleFieldChange("date_of_birth")}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" className="input" value={form.gender} onChange={handleFieldChange("gender")}>
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="blood_group">Blood group</label>
                <input
                  id="blood_group"
                  className="input"
                  placeholder="e.g. O+"
                  value={form.blood_group}
                  onChange={handleFieldChange("blood_group")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                className="textarea"
                value={form.address}
                onChange={handleFieldChange("address")}
              />
            </div>

            <div className="field">
              <label htmlFor="emergency_contact">Emergency contact</label>
              <input
                id="emergency_contact"
                className="input"
                value={form.emergency_contact}
                onChange={handleFieldChange("emergency_contact")}
              />
            </div>

            <div className="checkbox-row">
              <input
                id="create_login"
                type="checkbox"
                checked={form.create_login}
                onChange={handleFieldChange("create_login")}
              />
              <label htmlFor="create_login">Create a portal login for this patient</label>
            </div>

            {form.create_login && (
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleFieldChange("password")}
                />
                <span className="field-hint">An email address above is required to create a login.</span>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
