import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Plus } from "lucide-react";
import { useProfile } from "../contexts/ProfileContext";
import { APP_NAME } from "../shared/constants";
import PinDialog from "../components/profile/PinDialog";
import ProfileFormModal from "../components/profile/ProfileFormModal";

export default function ProfileSelectionPage() {
  const { t } = useTranslation();
  const { profiles, switchProfile } = useProfile();
  const [pinProfileId, setPinProfileId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    if (profile.pin_hash) {
      setPinProfileId(profileId);
    } else {
      switchProfile(profileId);
    }
  };

  const handlePinSuccess = () => {
    if (pinProfileId) {
      switchProfile(pinProfileId);
      setPinProfileId(null);
    }
  };

  const pinProfile = profiles.find((p) => p.id === pinProfileId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] p-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{APP_NAME}</h1>
      <p className="text-[var(--muted-foreground)] mb-10">{t("profile.select")}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg w-full">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: profile.color }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">{profile.name}</span>
            {profile.pin_hash && (
              <Lock size={14} className="text-[var(--muted-foreground)]" />
            )}
          </button>
        ))}

        <button
          onClick={() => setShowCreate(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--muted)]">
            <Plus size={24} className="text-[var(--muted-foreground)]" />
          </div>
          <span className="text-sm font-medium text-[var(--muted-foreground)]">
            {t("profile.create")}
          </span>
        </button>
      </div>

      {pinProfileId && pinProfile && (
        <PinDialog
          profileName={pinProfile.name}
          storedHash={pinProfile.pin_hash!}
          onSuccess={handlePinSuccess}
          onCancel={() => setPinProfileId(null)}
        />
      )}

      {showCreate && (
        <ProfileFormModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
