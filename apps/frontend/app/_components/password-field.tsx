"use client";

import { useState } from "react";

/** Поле пароля с переключателем видимости — как «глаз» в макете. */
export function PasswordField({
  id,
  label,
  value,
  autoComplete,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="auth-field" htmlFor={id}>
      <span className="auth-label">{label}</span>
      <span className="auth-input-wrap">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={label}
          required
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="auth-eye"
          type="button"
          aria-label={isVisible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? "🙈" : "👁"}
        </button>
      </span>
    </label>
  );
}
