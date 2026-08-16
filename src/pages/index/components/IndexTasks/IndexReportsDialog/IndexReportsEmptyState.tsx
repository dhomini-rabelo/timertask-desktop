interface IndexReportsEmptyStateProps {
  text: string;
}

export function IndexReportsEmptyState({ text }: IndexReportsEmptyStateProps) {
  return (
    <div className="py-6 flex items-center justify-center">
      <span className="text-base text-Black-400">{text}</span>
    </div>
  );
}
