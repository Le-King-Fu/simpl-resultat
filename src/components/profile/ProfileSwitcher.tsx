import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Lock, Settings } from "lucide-react";
import { useProfile } from "../../contexts/ProfileContext";
import PinDialog from "./PinDialog";
import ProfileFormModal from "./ProfileFormModal";
import type { Profile } from "../../services/profileService";

export default function ProfileSwitcher() {
  const { t } = useTranslation();
  const { profiles, activeProfile, switchProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [pinProfile, setPinProfile] = useState<Profile | null>(null);
  const [showManage, setShowManage] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (profile: Profile) => {
    setOpen(false);
    if (profile.id === activeProfile?.id) return;

    if (profile.pin_hash) {
      setPinProfile(profile);
    } else {
      switchProfile(profile.id);
    }
  };

  const handlePinSuccess = () => {
    if (pinProfile) {
      switchProfile(pinProfile.id);
      setPinProfile(null);
    }
  };

  return (
    <>
      <div ref={ref} className="relative px-3 pb-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: activeProfile?.color }}
          />
          <span className="truncate flex-1 text-left">{activeProfile?.name}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-lg bg-[var(--sidebar-bg)] border border-white/10 shadow-lg overflow-hidden">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelect(profile)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  profile.id === activeProfile?.id
                    ? "bg-[var(--sidebar-active)] text-white"
                    : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-fg)]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: profile.color }}
                />
                <span className="truncate flex-1 text-left">{profile.name}</span>
                {profile.pin_hash && <Lock size={12} className="opacity-50" />}
              </button>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                setShowManage(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm border-t border-white/10 hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-fg)]"
            >
              <Settings size={14} />
              <span>{t("profile.manageProfiles")}</span>
            </button>
          </div>
        )}
      </div>

      {pinProfile && (
        <PinDialog
          profileName={pinProfile.name}
          storedHash={pinProfile.pin_hash!}
          onSuccess={handlePinSuccess}
          onCancel={() => setPinProfile(null)}
        />
      )}

      {showManage && (
        <ProfileFormModal onClose={() => setShowManage(false)} />
      )}
    </>
  );
}
