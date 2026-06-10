import type { ComponentType } from "react";
import { AiOutlineBell, AiOutlineHome, AiOutlineMessage, AiOutlineSearch } from "react-icons/ai";
import { FiMap } from "react-icons/fi";
import { TbServer2 } from "react-icons/tb";
import { RiContactsBookLine, RiUser3Line, RiSettings3Line } from "react-icons/ri";

export type NavItem = {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  path: string;
  badge?: number;
};

export const desktopNavigation: NavItem[] = [
  { key: "feed", label: "Home", icon: AiOutlineHome, path: "/" },
  { key: "search", label: "Explore", icon: AiOutlineSearch, path: "/search" },
  { key: "map", label: "Map", icon: FiMap, path: "/mapfeed" },
  { key: "messages", label: "Messages", icon: AiOutlineMessage, path: "/messages", badge: 0 },
  { key: "contacts", label: "Contacts", icon: RiContactsBookLine, path: "/contacts" },
  { key: "servers", label: "Servers", icon: TbServer2, path: "/servers" },
  { key: "notifications", label: "Activity", icon: AiOutlineBell, path: "/notifications", badge: 0 },
];

export const mobileNavigation: NavItem[] = [
  { key: "feed", label: "Home", icon: AiOutlineHome, path: "/" },
  { key: "search", label: "Explore", icon: AiOutlineSearch, path: "/search" },
  { key: "map", label: "Map", icon: FiMap, path: "/mapfeed" },
  { key: "messages", label: "Messages", icon: AiOutlineMessage, path: "/messages", badge: 0 },
  { key: "profile", label: "Profile", icon: RiUser3Line, path: "/user" },
];

export const shellActionPath = {
  settings: "/settings",
  profile: "/user",
};

export const shellActionIcon = {
  settings: RiSettings3Line,
};
