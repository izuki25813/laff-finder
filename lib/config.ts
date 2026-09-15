const DEFAULT_LEGACY_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzdKS94B_pfhFz60ugR01gxUN45OkgzUy9_Nbhhcn0d49hDuMcuLkgFDpQxPK4BRh-Vag/exec";

export const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ??
  process.env.LEGACY_APPS_SCRIPT_URL ??
  DEFAULT_LEGACY_APPS_SCRIPT_URL;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
