/** Профиль, который отдаёт `/auth/me` и все ответы авторизации. */
export type AuthProfile = {
  id: string;
  email: string;
  displayName: string;
  picture: string | null;
  role: "REGULAR" | "ADMIN";
  isVerified: boolean;
  /** Мут закрывает только комментарии; форма знает об этом до отправки. */
  muted: boolean;
  /** `null` — мут бессрочный. */
  mutedUntil: string | null;
  muteReason: string | null;
  /** Дата регистрации в ISO — её показывает страница профиля. */
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
