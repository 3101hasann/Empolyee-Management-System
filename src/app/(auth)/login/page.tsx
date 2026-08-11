import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSessionUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center gap-10 px-4 py-10"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 55% 80% at 0% 85%, oklch(0.55 0.11 200 / 45%), transparent 70%), radial-gradient(ellipse 55% 80% at 100% 55%, oklch(0.68 0.15 128 / 40%), transparent 70%)",
      }}
    >
      <BrandLogo />

      <Card className="w-full max-w-[40rem] rounded-[20px] border-border/60 bg-card/80 shadow-[3px_0_90px_0_rgb(0_0_0/0.42)] backdrop-blur-lg">
        <CardContent className="space-y-6 p-8 sm:px-24 sm:py-13">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              Welcome{" "}
              <span aria-hidden="true" role="img">
                👋
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">Please login here</p>
          </div>
          <LoginForm />
        </CardContent>
      </Card>

      {/* Two stacked lines in the Figma frame. */}
      <h2 className="text-center text-3xl leading-snug font-bold sm:text-4xl">
        Employee
        <br />
        <span className="text-primary">Management</span>{" "}
        <span className="text-secondary">System</span>
      </h2>
    </main>
  );
}
