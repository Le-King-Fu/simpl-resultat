import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from "react";
import {
  loadProfiles,
  saveProfiles,
  deleteProfileDb,
  getNewProfileInitSql,
  hashPin,
  type Profile,
  type ProfilesConfig,
} from "../services/profileService";
import { connectToProfile, initializeNewProfileDb, closeDb } from "../services/db";

interface ProfileState {
  config: ProfilesConfig | null;
  isLoading: boolean;
  refreshKey: number;
  error: string | null;
}

type ProfileAction =
  | { type: "SET_CONFIG"; config: ProfilesConfig }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "INCREMENT_REFRESH" };

function reducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: action.config, error: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };
    case "INCREMENT_REFRESH":
      return { ...state, refreshKey: state.refreshKey + 1 };
    default:
      return state;
  }
}

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  refreshKey: number;
  error: string | null;
  switchProfile: (id: string) => Promise<void>;
  createProfile: (name: string, color: string, pin?: string) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Pick<Profile, "name" | "color">>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setPin: (id: string, pin: string | null) => Promise<void>;
  connectActiveProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    config: null,
    isLoading: true,
    refreshKey: 0,
    error: null,
  });

  const activeProfile = state.config?.profiles.find(
    (p) => p.id === state.config?.active_profile_id
  ) ?? null;

  // Load profiles on mount
  useEffect(() => {
    loadProfiles()
      .then((config) => {
        dispatch({ type: "SET_CONFIG", config });
        dispatch({ type: "SET_LOADING", isLoading: false });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", error: String(err) });
      });
  }, []);

  const connectActiveProfile = useCallback(async () => {
    if (!state.config) return;
    const profile = state.config.profiles.find(
      (p) => p.id === state.config!.active_profile_id
    );
    if (!profile) return;
    await connectToProfile(profile.db_filename);
  }, [state.config]);

  const switchProfile = useCallback(async (id: string) => {
    if (!state.config) return;
    const profile = state.config.profiles.find((p) => p.id === id);
    if (!profile) return;

    dispatch({ type: "SET_LOADING", isLoading: true });
    try {
      await closeDb();
      await connectToProfile(profile.db_filename);
      const newConfig = { ...state.config, active_profile_id: id };
      await saveProfiles(newConfig);
      dispatch({ type: "SET_CONFIG", config: newConfig });
      dispatch({ type: "INCREMENT_REFRESH" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: String(err) });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [state.config]);

  const createProfile = useCallback(async (name: string, color: string, pin?: string) => {
    if (!state.config) return;

    dispatch({ type: "SET_LOADING", isLoading: true });
    try {
      const id = crypto.randomUUID();
      const dbFilename = `profile_${id.split("-")[0]}.db`;
      const pinHash = pin ? await hashPin(pin) : null;
      const now = Date.now().toString();

      const newProfile: Profile = {
        id,
        name,
        color,
        pin_hash: pinHash,
        db_filename: dbFilename,
        created_at: now,
      };

      // Initialize the new database
      const sqlStatements = await getNewProfileInitSql();
      await initializeNewProfileDb(dbFilename, sqlStatements);

      // Reconnect to the current active profile's DB
      const currentProfile = state.config.profiles.find(
        (p) => p.id === state.config!.active_profile_id
      );
      if (currentProfile) {
        await connectToProfile(currentProfile.db_filename);
      }

      const newConfig: ProfilesConfig = {
        ...state.config,
        profiles: [...state.config.profiles, newProfile],
      };
      await saveProfiles(newConfig);
      dispatch({ type: "SET_CONFIG", config: newConfig });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: String(err) });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [state.config]);

  const updateProfile = useCallback(async (id: string, updates: Partial<Pick<Profile, "name" | "color">>) => {
    if (!state.config) return;

    const newProfiles = state.config.profiles.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    const newConfig = { ...state.config, profiles: newProfiles };
    await saveProfiles(newConfig);
    dispatch({ type: "SET_CONFIG", config: newConfig });
  }, [state.config]);

  const deleteProfile = useCallback(async (id: string) => {
    if (!state.config) return;
    const profile = state.config.profiles.find((p) => p.id === id);
    if (!profile) return;
    if (profile.db_filename === "simpl_resultat.db") return;

    dispatch({ type: "SET_LOADING", isLoading: true });
    try {
      // If deleting the active profile, switch to default first
      if (state.config.active_profile_id === id) {
        const defaultProfile = state.config.profiles.find(
          (p) => p.db_filename === "simpl_resultat.db"
        );
        if (defaultProfile) {
          await closeDb();
          await connectToProfile(defaultProfile.db_filename);
        }
      }

      await deleteProfileDb(profile.db_filename);

      const newProfiles = state.config.profiles.filter((p) => p.id !== id);
      const newActiveId =
        state.config.active_profile_id === id
          ? newProfiles[0]?.id ?? "default"
          : state.config.active_profile_id;

      const newConfig: ProfilesConfig = {
        active_profile_id: newActiveId,
        profiles: newProfiles,
      };
      await saveProfiles(newConfig);
      dispatch({ type: "SET_CONFIG", config: newConfig });
      if (state.config.active_profile_id === id) {
        dispatch({ type: "INCREMENT_REFRESH" });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: String(err) });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [state.config]);

  const setPin = useCallback(async (id: string, pin: string | null) => {
    if (!state.config) return;

    const pinHash = pin ? await hashPin(pin) : null;
    const newProfiles = state.config.profiles.map((p) =>
      p.id === id ? { ...p, pin_hash: pinHash } : p
    );
    const newConfig = { ...state.config, profiles: newProfiles };
    await saveProfiles(newConfig);
    dispatch({ type: "SET_CONFIG", config: newConfig });
  }, [state.config]);

  return (
    <ProfileContext.Provider
      value={{
        profiles: state.config?.profiles ?? [],
        activeProfile,
        isLoading: state.isLoading,
        refreshKey: state.refreshKey,
        error: state.error,
        switchProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        setPin,
        connectActiveProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
