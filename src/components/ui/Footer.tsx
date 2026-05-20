import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Tagline */}
        <div className="text-center">
          <p className="text-sm text-[#6B7280]">
            PrepFit — AI-powered interview preparation software for entry-level job seekers.
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            contact:{" "}
            <a href="mailto:support.prepfit@gmail.com" className="text-[#2563EB] hover:underline">
              support.prepfit@gmail.com
            </a>
            {" "}· Operated from India
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center justify-center gap-4 text-sm">
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

        <div className="text-center text-xs text-[#9CA3AF]">
          &copy; {new Date().getFullYear()} PrepFit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
