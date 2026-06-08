import { redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";

import { completeOnboardingAction } from "@/app/onboarding/actions";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const context = await requireCurrentUser();

  if (context.membership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpenCheck aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold leading-none">BoardReady PH</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Exam track onboarding
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Join your group</CardTitle>
            <CardDescription>
              Enter the access code provided by your BoardReady PH admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              action={completeOnboardingAction}
              defaultFullName={context.profile?.full_name ?? undefined}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
