import { Suspense } from "react";

import { redirect } from "next/navigation";

import { Globe } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { getAuthenticatedUser } from "@/lib/laravel-auth";

import { LoginForm } from "../../_components/login-form";
import { GoogleButton } from "../../_components/social-auth/google-button";

export default async function LoginV2() {
  const authenticatedUser = await getAuthenticatedUser();
  if (authenticatedUser) {
    redirect("/dashboard/inventory");
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Login to your account</h1>
          <p className="text-muted-foreground text-sm">Please enter your details to login.</p>
        </div>
        <div className="space-y-4">
          <Suspense fallback={<div className="text-center text-muted-foreground text-sm">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
