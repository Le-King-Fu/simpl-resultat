import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Trash2, Lock, LockOpen, Plus } from "lucide-react";
import { useProfile } from "../../contexts/ProfileContext";

const PRESET_COLORS = [
  "#4A90A4", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

interface Props {
  onClose: () => void;
  editProfileId?: string;
}

export default function ProfileFormModal({ onClose, editProfileId }: Props) {
  const { t } = useTranslation();
  const { profiles, createProfile, updateProfile, deleteProfile, setPin } = useProfile();

  const editProfile = editProfileId
    ? profiles.find((p) => p.id === editProfileId)
    : null;

  const [mode, setMode] = useState<"list" | "create" | "edit">(
    editProfileId ? "edit" : "list"
  );
  const [selectedId, setSelectedId] = useState<string | null>(editProfileId ?? null);
  const [name, setName] = useState(editProfile?.name ?? "");
  const [color, setColor] = useState(editProfile?.color ?? PRESET_COLORS[0]);
  const [pin, setPin_] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setMode("create");
    setName("");
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setPin_("");
    setSelectedId(null);
  };

  const handleEdit = (id: string) => {
    const p = profiles.find((pr) => pr.id === id);
    if (!p) return;
    setMode("edit");
    setSelectedId(id);
    setName(p.name);
    setColor(p.color);
    setPin_("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (mode === "create") {
        await createProfile(name.trim(), color, pin.length >= 4 ? pin : undefined);
      } else if (mode === "edit" && selectedId) {
        await updateProfile(selectedId, { name: name.trim(), color });
      }
      setMode("list");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile || profile.db_filename === "simpl_resultat.db") return;
    if (!confirm(t("profile.deleteConfirm"))) return;
    await deleteProfile(id);
  };

  const handleTogglePin = async (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    if (profile.pin_hash) {
      await setPin(id, null);
    } else {
      const newPin = prompt(t("profile.setPin"));
      if (newPin && newPin.length >= 4) {
        await setPin(id, newPin);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--foreground)]">
            {mode === "create"
              ? t("profile.create")
              : mode === "edit"
              ? t("profile.edit")
              : t("profile.manageProfiles")}
          </h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {mode === "list" ? (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 font-medium text-sm text-[var(--foreground)]">
                    {profile.name}
                  </span>
                  <button
                    onClick={() => handleTogglePin(profile.id)}
                    className="p-1.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                    title={profile.pin_hash ? t("profile.removePin") : t("profile.setPin")}
                  >
                    {profile.pin_hash ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                  <button
                    onClick={() => handleEdit(profile.id)}
                    className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white hover:opacity-90"
                  >
                    {t("common.edit")}
                  </button>
                  {profile.db_filename !== "simpl_resultat.db" && (
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="p-1.5 rounded hover:bg-[var(--muted)] text-[var(--negative)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 w-full p-3 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] text-[var(--muted-foreground)] text-sm transition-colors"
              >
                <Plus size={16} />
                {t("profile.create")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  {t("profile.name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("profile.namePlaceholder")}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  {t("profile.color")}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? "border-[var(--foreground)] scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {mode === "create" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    {t("profile.pin")} <span className="text-[var(--muted-foreground)] font-normal">({t("common.cancel").toLowerCase()})</span>
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin_(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="4-6 digits"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setMode("list")}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
