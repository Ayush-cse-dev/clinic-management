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

const EMPTY_FORM = { appointment_id: "", amount: "", billing_date: "", payment_method: "" };

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

export default function Billing() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = user?.role === "admin" || user?.role === "receptionist";

  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/billing");
      setBills(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not load billing records."), "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadBills();
  }, [loadBills]);

  useEffect(() => {
    if (!canManage) return;
    api
      .get("/appointments")
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]));
  }, [canManage]);

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
      await api.post("/billing", {
        ...form,
        appointment_id: Number(form.appointment_id),
        amount: Number(form.amount),
      });
      showToast("Bill created.", "success");
      setModalOpen(false);
      loadBills();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create bill."));
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (bill) => {
    try {
      await api.put(`/billing/${bill.id}`, { status: "paid" });
      showToast("Bill marked as paid.", "success");
      setBills((current) => current.map((b) => (b.id === bill.id ? { ...b, status: "paid" } : b)));
    } catch (err) {
      showToast(getErrorMessage(err, "Could not update bill."), "danger");
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        subtitle={user?.role === "patient" ? "Your invoices and payment status." : "Manage patient invoices."}
        actions={
          canManage && (
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <IconPlus className="btn-icon" />
              Create bill
            </button>
          )
        }
      />

      {loading && <Spinner />}

      {!loading && bills.length === 0 && (
        <EmptyState title="No bills yet" message="Invoices will appear here once created." />
      )}

      {!loading && bills.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>{bill.billing_date}</td>
                  <td className="cell-primary">{formatCurrency(bill.amount)}</td>
                  <td>{bill.payment_method || <span className="cell-muted">&mdash;</span>}</td>
                  <td>
                    <Badge status={bill.status} />
                  </td>
                  {canManage && (
                    <td className="row-actions">
                      {bill.status !== "paid" && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => markPaid(bill)}>
                          Mark paid
                        </button>
                      )}
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
          title="Create bill"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="billing-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Create bill"}
              </button>
            </>
          }
        >
          <form id="billing-form" onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}

            <div className="field">
              <label htmlFor="appointment_id">Appointment</label>
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
                    {a.appointment_date} &mdash; {a.patient?.full_name || `Patient #${a.patient_id}`} &mdash; Dr.{" "}
                    {a.doctor?.full_name || a.doctor_id}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  required
                  value={form.amount}
                  onChange={handleFieldChange("amount")}
                />
              </div>
              <div className="field">
                <label htmlFor="billing_date">Date</label>
                <input
                  id="billing_date"
                  type="date"
                  className="input"
                  required
                  value={form.billing_date}
                  onChange={handleFieldChange("billing_date")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="payment_method">Payment method</label>
              <select
                id="payment_method"
                className="input"
                value={form.payment_method}
                onChange={handleFieldChange("payment_method")}
              >
                <option value="">Not specified</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
