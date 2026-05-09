import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  loading?: boolean;
}

const base = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] px-6 py-2.5",
  secondary: "border border-[#E5E7EB] text-[#111827] hover:bg-gray-50 px-6 py-2.5",
  ghost: "text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 px-3 py-2",
};

export default function Button({
  children,
  variant = "primary",
  href,
  onClick,
  disabled,
  type = "button",
  className = "",
  loading,
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cls}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
