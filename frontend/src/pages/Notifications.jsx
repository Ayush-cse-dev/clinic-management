import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { IconBell, IconPlus } from "../components/icons";

const EMPTY_FORM = { user_id: "", title: "", message: "" };

export default function Notifications() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canSend = user?.role === "admin" || user?.role === "receptionist";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not load notifications."), "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadNotifications();
  }, [loadNotifications]);

  const openSendModal = () => {
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
      await api.post("/notifications", { ...form, user_id: Number(form.user_id) });
      showToast("Notification sent.", "success");
      setModalOpen(false);
      loadNotifications();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not send notification."));
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (notification) => {
    try {
      await api.put(`/notifications/${notification.id}/read`);
      setNotifications((current) =>
        current.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      showToast(getErrorMessage(err, "Could not update notification."), "danger");
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle="Updates and alerts for your account."
        actions={
          canSend && (
            <button type="button" className="btn btn-primary" onClick={openSendModal}>
              <IconPlus className="btn-icon" />
              Send notification
            </button>
          )
        }
      />

      {loading && <Spinner />}

      {!loading && notifications.length === 0 && (
        <EmptyState title="You're all caught up" message="New notifications will show up here." />
      )}

      {!loading && notifications.length > 0 && (
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="card-padded"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                borderBottom: "1px solid var(--color-border)",
                opacity: n.is_read ? 0.6 : 1,
              }}
            >
              <IconBell style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div className="cell-primary">{n.title}</div>
                <p className="text-muted" style={{ margin: "4px 0" }}>
                  {n.message}
                </p>
                <span className="text-muted" style={{ fontSize: "var(--fs-xs)" }}>
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              {!n.is_read && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => markRead(n)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title="Send notification"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="notification-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Sending..." : "Send"}
              </button>
            </>
          }
        >
          <form id="notification-form" onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}

            <div className="field">
              <label htmlFor="user_id">Recipient user ID</label>
              <input
                id="user_id"
                type="number"
                min="1"
                className="input"
                required
                value={form.user_id}
                onChange={handleFieldChange("user_id")}
              />
              <span className="field-hint">
                The internal login ID of the user to notify (visible to admins).
              </span>
            </div>

            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                className="input"
                required
                value={form.title}
                onChange={handleFieldChange("title")}
              />
            </div>

            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                className="textarea"
                required
                value={form.message}
                onChange={handleFieldChange("message")}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
