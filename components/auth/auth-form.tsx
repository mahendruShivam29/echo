"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const supabase = createClient();

  return (
    <div className="mx-auto w-full max-w-md rounded-md bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "#34d399",
                brandAccent: "#6ee7b7",
                inputBackground: "rgba(255,255,255,0.05)",
                inputBorder: "rgba(255,255,255,0.12)",
                inputText: "#ffffff",
                inputLabelText: "#d4d4d8",
                defaultButtonBackground: "rgba(255,255,255,0.08)",
                defaultButtonBackgroundHover: "rgba(255,255,255,0.14)"
              },
              radii: {
                borderRadiusButton: "6px",
                inputBorderRadius: "6px"
              }
            }
          }
        }}
        providers={[]}
        redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/library`}
      />
    </div>
  );
}
