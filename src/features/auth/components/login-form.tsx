"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      // On success loginAction redirects and never returns.
      setServerError(result.error);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Figma inputs: always-on blue border with the label floating inside the field. */}
      <div className="space-y-2">
        <div className="relative">
          <Label
            htmlFor="email"
            className="pointer-events-none absolute top-2 left-4 text-[11px] font-light text-secondary"
          >
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="robertallen@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            disabled={isPending}
            className="h-14 rounded-[10px] border-secondary/70 px-4 pt-6 pb-1.5 focus-visible:border-secondary focus-visible:ring-secondary/30"
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Label
            htmlFor="password"
            className="pointer-events-none absolute top-2 left-4 text-[11px] font-light text-secondary"
          >
            Password
          </Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(form.formState.errors.password)}
            disabled={isPending}
            className="h-14 rounded-[10px] border-secondary/70 px-4 pt-6 pb-1.5 pr-12 focus-visible:border-secondary focus-visible:ring-secondary/30"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {form.formState.errors.password ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <Checkbox
              id="rememberMe"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              disabled={isPending}
              // Figma checked state is blue (#1c86bb), not the lime primary.
              className="size-5 data-checked:border-secondary data-checked:bg-secondary data-checked:text-white dark:data-checked:bg-secondary"
            />
          )}
        />
        <Label htmlFor="rememberMe" className="font-normal">
          Remember Me
        </Label>
      </div>

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      {/* Figma gradient (#5d973f → #b6d232, top-to-bottom); dark text kept for contrast. */}
      <Button
        type="submit"
        disabled={isPending}
        className="h-14 w-full rounded-[10px] bg-gradient-to-b from-[#5d973f] to-[#b6d232] text-base font-semibold"
      >
        {isPending ? "Signing in…" : "Login"}
      </Button>
    </form>
  );
}
