export function PageHeader({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex min-h-9 items-center gap-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </div>
  );
}
