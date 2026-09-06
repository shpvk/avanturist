"use client";

import { useState } from "react";

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
          required
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="auth-eye"
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? "🙈" : "👁"}
        </button>
      </span>
    </label>
  );
}
