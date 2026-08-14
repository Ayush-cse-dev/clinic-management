export default function Spinner({ centered = true }) {
  if (!centered) return <span className="spinner" role="status" aria-label="Loading" />;
  return (
    <div className="spinner-center">
      <span className="spinner" role="status" aria-label="Loading" />
    </div>
  );
}
