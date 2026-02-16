import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { verifyPin } from "../../services/profileService";

interface Props {
  profileName: string;
  storedHash: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinDialog({ profileName, storedHash, onSuccess, onCancel }: Props) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInput = async (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check PIN when we have at least 4 digits filled
    const pin = newDigits.join("");
    if (pin.length >= 4 && !newDigits.slice(0, 4).includes("")) {
      // If all filled digits are present and we're at the last one typed
      const filledCount = newDigits.filter((d) => d !== "").length;
      if (value && filledCount === index + 1) {
        setChecking(true);
        try {
          const valid = await verifyPin(pin.replace(/\s/g, ""), storedHash);
          if (valid) {
            onSuccess();
          } else if (filledCount >= 6 || (filledCount >= 4 && index === filledCount - 1 && !value)) {
            setError(true);
            setDigits(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
          }
        } finally {
          setChecking(false);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Escape") {
      onCancel();
    }
    if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length >= 4) {
        setChecking(true);
        verifyPin(pin, storedHash).then((valid) => {
          setChecking(false);
          if (valid) {
            onSuccess();
          } else {
            setError(true);
            setDigits(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
          }
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-xs border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--foreground)]">{profileName}</h3>
          <button onClick={onCancel} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[var(--muted-foreground)] mb-4">{t("profile.enterPin")}</p>

        <div className="flex gap-2 justify-center mb-4">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={checking}
              className={`w-10 h-12 text-center text-lg font-bold rounded-lg border-2 bg-[var(--background)] text-[var(--foreground)] ${
                error ? "border-[var(--negative)]" : "border-[var(--border)] focus:border-[var(--primary)]"
              } outline-none transition-colors`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-[var(--negative)] text-center">{t("profile.wrongPin")}</p>
        )}
      </div>
    </div>
  );
}
