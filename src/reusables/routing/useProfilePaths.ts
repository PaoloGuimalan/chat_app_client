import { useSyncExternalStore } from "react";
import { profilePathsVersion, subscribeProfilePaths } from "./profilePaths";

// A late boot-config response also updates mounted forms/profile boundaries.
export const useProfilePathsVersion = () =>
  useSyncExternalStore(subscribeProfilePaths, profilePathsVersion, profilePathsVersion);
