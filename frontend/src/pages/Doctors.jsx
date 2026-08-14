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
  specialization: "",
  experience_years: 0,
  consultation_fee: 0,
  availability: "",
  create_login: false,
  password: "",
};

export default function Doctors() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = user?.role === "admin" || user?.role === "receptionist";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDoctors = useCallback(
    async (query) => {
      setLoading(true);
      try {
        const res = await api.get("/doctors", { params: query ? { search: query } : {} });
        setDoctors(res.data);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not load doctors."), "danger");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadDoctors();
  }, [loadDoctors]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadDoctors(search);
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const handleFieldChange = (field) => (event) => {
    let value = event.target.value;
    if (field === "create_login") value = event.target.checked;
    if (field === "experience_years" || field === "consultation_fee") value = Number(value);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (form.create_login && !form.password) {
      setFormError("A password is required to create a login for this doctor.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.create_login) delete payload.password;
      await api.post("/doctors", payload);
      showToast("Doctor added successfully.", "success");
      setModalOpen(false);
      loadDoctors(search);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not add doctor."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Remove Dr. ${doctor.full_name} from the directory?`)) return;
    try {
      await api.delete(`/doctors/${doctor.id}`);
      showToast("Doctor removed.", "success");
      setDoctors((current) => current.filter((d) => d.id !== doctor.id));
    } catch (err) {
      showToast(getErrorMessage(err, "Could not remove doctor."), "danger");
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Directory"
        title="Doctors"
        subtitle="Browse the clinic's doctors and their specializations."
        actions={
          canManage && (
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <IconPlus className="btn-icon" />
              Add doctor
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
              placeholder="Search by name or specialization"
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

      {!loading && doctors.length === 0 && (
        <EmptyState title="No doctors found" message="Try a different search, or add a new doctor." />
      )}

      {!loading && doctors.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Fee</th>
                <th>Phone</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="cell-primary">Dr. {doctor.full_name}</td>
                  <td>{doctor.specialization}</td>
                  <td>{doctor.experience_years} yrs</td>
                  <td>${doctor.consultation_fee}</td>
                  <td>{doctor.phone || <span className="cell-muted">&mdash;</span>}</td>
                  {canManage && (
                    <td className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(doctor)}
                        aria-label={`Remove Dr. ${doctor.full_name}`}
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
          title="Add doctor"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="doctor-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save doctor"}
              </button>
            </>
          }
        >
          <form id="doctor-form" onSubmit={handleSubmit}>
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
                <label htmlFor="specialization">Specialization</label>
                <input
                  id="specialization"
                  className="input"
                  required
                  value={form.specialization}
                  onChange={handleFieldChange("specialization")}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  required
                  value={form.email}
                  onChange={handleFieldChange("email")}
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={form.phone} onChange={handleFieldChange("phone")} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="experience_years">Experience (years)</label>
                <input
                  id="experience_years"
                  type="number"
                  min="0"
                  className="input"
                  value={form.experience_years}
                  onChange={handleFieldChange("experience_years")}
                />
              </div>
              <div className="field">
                <label htmlFor="consultation_fee">Consultation fee ($)</label>
                <input
                  id="consultation_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.consultation_fee}
                  onChange={handleFieldChange("consultation_fee")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="availability">Availability</label>
              <input
                id="availability"
                className="input"
                placeholder="e.g. Mon-Fri, 9AM-5PM"
                value={form.availability}
                onChange={handleFieldChange("availability")}
              />
            </div>

            <div className="checkbox-row">
              <input
                id="create_login"
                type="checkbox"
                checked={form.create_login}
                onChange={handleFieldChange("create_login")}
              />
              <label htmlFor="create_login">Create a portal login for this doctor</label>
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
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
