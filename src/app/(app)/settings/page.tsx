import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DeleteAccountButton from "@/components/ui/DeleteAccountButton";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const isPremium = user.isPremium;
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id! },
  });

  const subActive = subscription?.status === "active" || subscription?.status === "on_trial";
  const canDelete = !subActive;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Settings</h1>
      </div>

      {/* Account Info */}
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

      {/* Manage Subscription */}
      {subscription && subscription.status !== "inactive" && (
        <Card className="mb-5">
          <h3 className="text-[16px] font-medium text-[#111827] mb-4">Manage Subscription</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Status</span>
              <span className={`font-medium capitalize ${
                subscription.status === "active" ? "text-green-600" :
                subscription.status === "past_due" ? "text-orange-600" :
                "text-[#6B7280]"
              }`}>{subscription.status.replace("_", " ")}</span>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Renews</span>
                <span className="text-[#111827] font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-[#E5E7EB]">
              <p className="text-xs text-[#9CA3AF] mb-2">
                To cancel or modify your subscription, visit the Lemon Squeezy billing portal.
              </p>
              <a
                href="https://prepfit.lemonsqueezy.com/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:underline"
              >
                Open Billing Portal
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Account — blocked or allowed */}
      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Delete Account &amp; Data</h3>

        {!canDelete ? (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-[12px]">
            <p className="text-sm text-orange-800 font-medium mb-2">You have an active premium subscription.</p>
            <p className="text-sm text-orange-700 mb-3">
              Please cancel your subscription before deleting your account to avoid continued billing.
            </p>
            <a
              href="https://prepfit.lemonsqueezy.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#2563EB] hover:underline"
            >
              Manage Subscription →
            </a>
          </div>
        ) : (
          <>
            <DeleteAccountButton userEmail={user.email || ""} />
            <p className="text-xs text-[#9CA3AF] mt-3">
              Permanently deletes your account, analyses, interview history, and all stored data.
              This cannot be undone.
            </p>
          </>
        )}
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
