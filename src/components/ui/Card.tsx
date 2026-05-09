"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[16px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${
        hover ? "transition-shadow duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] cursor-pointer" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardIcon({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
      style={{ background: gradient }}
    >
      {children}
    </div>
  );
}
