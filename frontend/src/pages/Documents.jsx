import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { IconDownload, IconTrash, IconUpload } from "../components/icons";

export default function Documents() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canUpload = user?.role === "admin" || user?.role === "receptionist" || user?.role === "doctor";
  const canDelete = user?.role === "admin" || user?.role === "receptionist";

  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not load documents."), "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens after the awaited request resolves, not synchronously
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!canUpload) return;
    api
      .get("/patients")
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]));
  }, [canUpload]);

  const openUploadModal = () => {
    setPatientId("");
    setFile(null);
    setFormError("");
    setModalOpen(true);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!patientId) {
      setFormError("Please select a patient.");
      return;
    }
    if (!file) {
      setFormError("Please choose a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/documents", formData, {
        params: { patient_id: Number(patientId) },
        headers: { "Content-Type": undefined },
      });
      showToast("Document uploaded.", "success");
      setModalOpen(false);
      loadDocuments();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not upload document."));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not download document."), "danger");
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      showToast("Document deleted.", "success");
      setDocuments((current) => current.filter((d) => d.id !== doc.id));
    } catch (err) {
      showToast(getErrorMessage(err, "Could not delete document."), "danger");
    }
  };

  return (
    <div className="content">
      <PageHeader
        eyebrow="Records"
        title="Documents"
        subtitle={user?.role === "patient" ? "Files shared with your care team." : "Patient files and reports."}
        actions={
          canUpload && (
            <button type="button" className="btn btn-primary" onClick={openUploadModal}>
              <IconUpload className="btn-icon" />
              Upload document
            </button>
          )
        }
      />

      {loading && <Spinner />}

      {!loading && documents.length === 0 && (
        <EmptyState title="No documents yet" message="Uploaded files will appear here." />
      )}

      {!loading && documents.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>File name</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="cell-primary">{doc.file_name}</td>
                  <td>{doc.file_type || <span className="cell-muted">&mdash;</span>}</td>
                  <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDownload(doc)}
                      aria-label={`Download ${doc.file_name}`}
                    >
                      <IconDownload />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(doc)}
                        aria-label={`Delete ${doc.file_name}`}
                      >
                        <IconTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title="Upload document"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="upload-form" className="btn btn-primary" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </>
          }
        >
          <form id="upload-form" onSubmit={handleUpload}>
            {formError && <div className="form-error-banner">{formError}</div>}

            <div className="field">
              <label htmlFor="patient_id">Patient</label>
              <select
                id="patient_id"
                className="input"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="file">File</label>
              <input
                id="file"
                ref={fileInputRef}
                type="file"
                className="input"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <span className="field-hint">PDF, images, Word docs, or text files up to 10MB.</span>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
