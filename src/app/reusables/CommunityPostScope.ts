import { createContext } from "react";

/** Destination already supplied by the surrounding community profile. */
export const CommunityPostScope = createContext<string | null>(null);
/** A visited profile may tag its owner, but cannot redirect that post into a community. */
export const CommunityDestinationAllowed = createContext(true);
