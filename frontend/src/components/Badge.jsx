const VARIANT_BY_STATUS = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  paid: "success",
  unpaid: "warning",
};

export default function Badge({ status, children }) {
  const variant = VARIANT_BY_STATUS[status?.toLowerCase()] || "neutral";
  return <span className={`badge badge-${variant}`}>{children || status}</span>;
}
