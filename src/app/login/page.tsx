import { BookOpenCheck } from "lucide-react";

import { loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params?.next ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <section className="space-y-6">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpenCheck aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase text-primary">
              Private access
            </p>
            <h1 className="text-4xl font-semibold tracking-normal text-foreground">
              BoardReady PH
            </h1>
            <p className="max-w-md text-muted-foreground">
              A focused exam-prep workspace for Philippine board, licensure,
              and major exam takers.
            </p>
          </div>
        </section>

        <AuthForm mode="login" action={loginAction} redirectTo={redirectTo} />
      </div>
    </main>
  );
}
