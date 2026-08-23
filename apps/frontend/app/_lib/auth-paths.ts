export const signInPath = "/signin-with-chatgpt";
export const signOutPath = "/signout-with-chatgpt";
export const callbackPath = "/callback";

/** Sign-in link that comes back to `returnTo`, with open-redirect targets stripped. */
export function chatGPTSignInPath(returnTo: string): string {
  return `${signInPath}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  return `${signOutPath}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

/** Only same-site paths survive, and never an auth route (that would loop). */
export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return pathname === signInPath || pathname === signOutPath || pathname === callbackPath;
}
