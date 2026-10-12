type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading content...' }: LoadingStateProps) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
