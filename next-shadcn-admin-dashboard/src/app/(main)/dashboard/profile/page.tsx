import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/laravel-auth";

import { ChangePasswordForm } from "./_components/change-password-form";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Gerez votre compte et modifiez votre mot de passe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <p className="font-medium text-sm">Nom</p>
            <p className="text-muted-foreground text-sm">{user?.name ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">Email</p>
            <p className="text-muted-foreground text-sm">{user?.email ?? "-"}</p>
          </div>

          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
