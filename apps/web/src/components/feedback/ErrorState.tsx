type ErrorStateProps = {
  title?: string;
  description: string;
};

export function ErrorState({ title = 'Something went wrong', description }: ErrorStateProps) {
  return (
    <div className="state-panel error" role="alert">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
