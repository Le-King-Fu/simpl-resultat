import { useReducer, useCallback, useRef } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type UpdateStatus =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "downloading"
  | "readyToInstall"
  | "installing"
  | "error";

interface UpdaterState {
  status: UpdateStatus;
  version: string | null;
  body: string | null;
  progress: number;
  contentLength: number | null;
  error: string | null;
}

type UpdaterAction =
  | { type: "CHECK_START" }
  | { type: "UP_TO_DATE" }
  | { type: "AVAILABLE"; version: string; body: string | null }
  | { type: "DOWNLOAD_START" }
  | { type: "DOWNLOAD_PROGRESS"; downloaded: number; contentLength: number | null }
  | { type: "READY_TO_INSTALL" }
  | { type: "INSTALLING" }
  | { type: "ERROR"; error: string };

const initialState: UpdaterState = {
  status: "idle",
  version: null,
  body: null,
  progress: 0,
  contentLength: null,
  error: null,
};

function reducer(state: UpdaterState, action: UpdaterAction): UpdaterState {
  switch (action.type) {
    case "CHECK_START":
      return { ...initialState, status: "checking" };
    case "UP_TO_DATE":
      return { ...state, status: "upToDate", error: null };
    case "AVAILABLE":
      return { ...state, status: "available", version: action.version, body: action.body, error: null };
    case "DOWNLOAD_START":
      return { ...state, status: "downloading", progress: 0, contentLength: null, error: null };
    case "DOWNLOAD_PROGRESS":
      return { ...state, progress: action.downloaded, contentLength: action.contentLength ?? state.contentLength };
    case "READY_TO_INSTALL":
      return { ...state, status: "readyToInstall", error: null };
    case "INSTALLING":
      return { ...state, status: "installing", error: null };
    case "ERROR":
      return { ...state, status: "error", error: action.error };
  }
}

export function useUpdater() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const updateRef = useRef<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    dispatch({ type: "CHECK_START" });
    try {
      const update = await check();
      if (update) {
        updateRef.current = update;
        dispatch({ type: "AVAILABLE", version: update.version, body: update.body ?? null });
      } else {
        dispatch({ type: "UP_TO_DATE" });
      }
    } catch (e) {
      dispatch({ type: "ERROR", error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;

    dispatch({ type: "DOWNLOAD_START" });
    try {
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          dispatch({
            type: "DOWNLOAD_PROGRESS",
            downloaded: 0,
            contentLength: event.data.contentLength ?? null,
          });
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          dispatch({
            type: "DOWNLOAD_PROGRESS",
            downloaded,
            contentLength: null,
          });
        } else if (event.event === "Finished") {
          // handled below
        }
      });
      dispatch({ type: "READY_TO_INSTALL" });
    } catch (e) {
      dispatch({ type: "ERROR", error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const installAndRestart = useCallback(async () => {
    dispatch({ type: "INSTALLING" });
    try {
      await relaunch();
    } catch (e) {
      dispatch({ type: "ERROR", error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  return { state, checkForUpdate, downloadAndInstall, installAndRestart };
}
