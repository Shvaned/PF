import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DeleteAccountButton from "@/components/ui/DeleteAccountButton";
import BillingPortalButton from "@/components/ui/BillingPortalButton";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const isPremium = user.isPremium;
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id! },
  });

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Settings</h1>
      </div>

      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Name</span>
            <span className="text-[#111827] font-medium">{user.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Email</span>
            <span className="text-[#111827] font-medium">{user.email || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Plan</span>
            <span className={`font-medium ${isPremium ? "text-green-600" : "text-[#6B7280]"}`}>
              {isPremium ? "Premium" : "Free"}
            </span>
          </div>
        </div>
      </Card>

      {subscription && subscription.status !== "inactive" && (
        <Card className="mb-5">
          <h3 className="text-[16px] font-medium text-[#111827] mb-4">Subscription</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Status</span>
              <span className="text-[#111827] font-medium capitalize">{subscription.status}</span>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Renews</span>
                <span className="text-[#111827] font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="pt-2">
              <BillingPortalButton />
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Data &amp; Privacy</h3>
        <div className="space-y-3">
          <DeleteAccountButton />
          <p className="text-xs text-[#9CA3AF]">
            This permanently deletes your account, analyses, and all stored data. This action cannot be undone.
          </p>
        </div>
      </Card>

      {!isPremium && (
        <Card className="bg-gradient-to-r from-[#60A5FA]/5 to-[#2563EB]/5 border border-[#2563EB]/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-medium text-[#111827]">Upgrade to Premium</h3>
              <p className="text-sm text-[#6B7280]">Unlock unlimited analyses and advanced features.</p>
            </div>
            <Button href="/premium">Upgrade</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
