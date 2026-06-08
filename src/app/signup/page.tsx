import { BookOpenCheck } from "lucide-react";

import { signupAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <section className="space-y-6">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpenCheck aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase text-primary">
              Invite-only beta
            </p>
            <h1 className="text-4xl font-semibold tracking-normal text-foreground">
              Create your BoardReady PH account
            </h1>
            <p className="max-w-md text-muted-foreground">
              After signup, enter your full name and group invite code to unlock
              your private exam-prep dashboard.
            </p>
          </div>
        </section>

        <AuthForm mode="signup" action={signupAction} />
      </div>
    </main>
  );
}
