// Shown instantly while a page is being prepared, so every click feels answered.
export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-label="Loading">
      <i className="route-bar" />
    </div>
  );
}
