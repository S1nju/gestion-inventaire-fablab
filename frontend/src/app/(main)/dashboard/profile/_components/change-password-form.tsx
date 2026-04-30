"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Please confirm the new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"],
  });

function getBackendApiUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/?$/, "/api") ??
    "http://localhost:8000/api"
  );
}

function getTokenFromCookie() {
  const match = document.cookie.match(/(?:^|; )inventory_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function ChangePasswordForm() {
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    const token = getTokenFromCookie();
    if (!token) {
      toast.error("You are not authenticated.");
      return;
    }

    try {
      const response = await fetch(`${getBackendApiUrl().replace(/\/$/, "")}/user/password`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: values.currentPassword,
          password: values.newPassword,
          password_confirmation: values.confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstCurrentPasswordError = Array.isArray(payload?.errors?.current_password)
          ? payload.errors.current_password[0]
          : undefined;
        const firstPasswordError = Array.isArray(payload?.errors?.password) ? payload.errors.password[0] : undefined;
        const message = firstCurrentPasswordError ?? firstPasswordError ?? payload?.message ?? "Failed to update password.";
        throw new Error(message);
      }

      toast.success(payload?.message ?? "Password updated successfully.");
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update password.";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-medium text-base">Changer le mot de passe</h3>
        <p className="text-muted-foreground text-sm">Saisissez votre mot de passe actuel puis un nouveau mot de passe.</p>
      </div>

      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="current-password">Mot de passe actuel</FieldLabel>
              <Input {...field} id="current-password" type="password" autoComplete="current-password" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
              <Input {...field} id="new-password" type="password" autoComplete="new-password" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirm-password">Confirmer le mot de passe</FieldLabel>
              <Input {...field} id="confirm-password" type="password" autoComplete="new-password" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Mise a jour..." : "Mettre a jour le mot de passe"}
      </Button>
    </form>
  );
}
