import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EFF6FF] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-[16px] font-medium text-[#111827] mb-1">{title}</h3>
      <p className="text-sm text-[#6B7280] mb-6 max-w-sm mx-auto">{description}</p>
      {action && <Button href={action.href}>{action.label}</Button>}
    </div>
  );
}
