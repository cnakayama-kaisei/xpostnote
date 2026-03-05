import { requireAppUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const appUser = await requireAppUser();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-8">プロフィール</h1>
      <ProfileForm
        email={appUser.email}
        displayName={appUser.displayName}
        role={appUser.role}
      />
    </div>
  );
}
