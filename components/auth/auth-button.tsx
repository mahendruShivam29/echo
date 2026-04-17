"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!user) {
    return (
      <Button asChild variant="secondary" className="w-full">
        <Link href="/auth">
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full"
      onClick={() => {
        void supabase.auth.signOut();
      }}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
