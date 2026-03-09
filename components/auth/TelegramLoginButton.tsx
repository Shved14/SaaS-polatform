"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

declare global {
  interface Window {
    onTelegramAuth?: (user: unknown) => void;
  }
}

interface TelegramLoginButtonProps {
  size?: "small" | "medium" | "large";
}

const sizeMap: Record<string, string> = {
  small: "small",
  medium: "medium",
  large: "large"
};

export function TelegramLoginButton({
  size = "medium"
}: TelegramLoginButtonProps) {
  useEffect(() => {
    window.onTelegramAuth = async (user: unknown) => {
      try {
        await signIn("credentials", {
          telegramAuth: JSON.stringify(user),
          callbackUrl: "/app/dashboard"
        });
      } catch (e) {
        console.error("Telegram auth failed", e);
      }
    };

    const scriptId = "telegram-login-widget";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute(
      "data-telegram-login",
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || ""
    );
    script.setAttribute("data-size", sizeMap[size] || "medium");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.appendChild(script);
    } else {
      document.body.appendChild(script);
    }

    return () => {
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [size]);

  return (
    <div
      id="telegram-login-container"
      className="flex w-full justify-center"
    />
  );
}

