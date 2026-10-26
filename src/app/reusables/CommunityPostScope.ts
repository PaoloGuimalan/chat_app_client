import { createContext } from "react";

/** Destination already supplied by the surrounding community profile. */
export const CommunityPostScope = createContext<string | null>(null);
