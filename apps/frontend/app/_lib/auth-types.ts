export type AuthProfile = {
  id: string;
  email: string;
  displayName: string;
  picture: string | null;
  role: "REGULAR" | "ADMIN";
  isVerified: boolean;
  muted: boolean;
  mutedUntil: string | null;
  muteReason: string | null;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthResponse = AuthTokens & { user: AuthProfile };

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  passwordRepeat: string;
  turnstileToken?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  turnstileToken?: string;
};
