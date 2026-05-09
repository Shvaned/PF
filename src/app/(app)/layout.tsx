import Sidebar from "@/components/ui/Sidebar";
import { MobileNav } from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:ml-60 pb-16 md:pb-0">
        <Topbar />
        <main className="p-5 max-w-[1200px]">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
