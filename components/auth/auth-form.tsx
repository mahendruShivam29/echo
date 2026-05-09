"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const normalizedEmail = email.trim();
    const redirectTo = `${window.location.origin}/library`;

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.replace("/library");
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.replace("/library");
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account, then sign in.");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Could not reach Supabase Auth. Check your network and project URL."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-md bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-zinc-950/40 p-1 ring-1 ring-white/10">
        <ModeButton active={mode === "signin"} onClick={() => setMode("signin")}>
          Sign in
        </ModeButton>
        <ModeButton active={mode === "signup"} onClick={() => setMode("signup")}>
          Sign up
        </ModeButton>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail className="h-4 w-4 text-emerald-300" />
            Email
          </span>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="h-4 w-4 text-emerald-300" />
            Password
          </span>
          <Input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </label>

        <AnimatePresence mode="wait">
          {error ? (
            <StatusText key={error} tone="error">
              {error}
            </StatusText>
          ) : message ? (
            <StatusText key={message} tone="success">
              {message}
            </StatusText>
          ) : (
            <StatusText key={mode} tone="muted">
              {mode === "signin"
                ? "Use your confirmed email and password."
                : "A confirmation email may be required before sign in."}
            </StatusText>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !email.trim() || password.length < 6}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Connecting..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-md px-3 py-2 text-sm font-bold text-zinc-400 transition hover:text-white",
        active && "text-white"
      )}
    >
      {active ? (
        <motion.span
          layoutId="auth-mode"
          className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/10"
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function StatusText({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: "error" | "success" | "muted";
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "rounded-md px-3 py-2 text-sm ring-1",
        tone === "error" && "bg-red-500/10 text-red-200 ring-red-400/20",
        tone === "success" && "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
        tone === "muted" && "bg-white/[0.04] text-zinc-400 ring-white/10"
      )}
    >
      {children}
    </motion.p>
  );
}
