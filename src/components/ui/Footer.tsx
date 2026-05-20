import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <span>&copy; {new Date().getFullYear()} PrepFit</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Prepare for interviews faster</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/terms" className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            Privacy
          </Link>
          <Link href="/refund-policy" className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            Refunds
          </Link>
        </div>
      </div>
    </footer>
  );
}
