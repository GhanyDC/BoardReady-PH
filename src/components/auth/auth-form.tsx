"use client";

import Link from "next/link";
import { LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { useActionState } from "react";

import type { AuthFormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type AuthFormProps = {
  mode: "login" | "signup";
  action: AuthAction;
  redirectTo?: string;
};

export function AuthForm({ mode, action, redirectTo }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const isLogin = mode === "login";
  const Icon = isLogin ? LogIn : UserPlus;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isLogin ? "Log in" : "Create account"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Use your BoardReady PH account."
            : "Create your private exam-prep account, then join your group."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            {state.errors?.email ? (
              <p className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
            {state.errors?.password ? (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            ) : null}
          </div>

          {state.message ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          {state.success ? (
            <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {state.success}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Icon aria-hidden="true" />
            )}
            {isLogin ? "Log in" : "Sign up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
