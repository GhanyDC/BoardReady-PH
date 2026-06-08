"use client";

import { LoaderCircle, UserRoundCheck } from "lucide-react";
import { useActionState } from "react";

import type { OnboardingFormState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingAction = (
  state: OnboardingFormState,
  formData: FormData,
) => Promise<OnboardingFormState>;

type OnboardingFormProps = {
  action: OnboardingAction;
  defaultFullName?: string;
};

export function OnboardingForm({
  action,
  defaultFullName,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={defaultFullName}
          placeholder="Juan Dela Cruz"
          required
        />
        {state.errors?.fullName ? (
          <p className="text-sm text-destructive">
            {state.errors.fullName[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inviteCode">Group invite code</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="BOARDREADY-PH"
          required
        />
        {state.errors?.inviteCode ? (
          <p className="text-sm text-destructive">
            {state.errors.inviteCode[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <UserRoundCheck aria-hidden="true" />
        )}
        Join group
      </Button>
    </form>
  );
}
