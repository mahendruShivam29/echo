import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function AuthPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/library");
  }

  return (
    <section className="flex min-h-[calc(100dvh-14rem)] items-center justify-center">
      <div className="w-full space-y-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Sign in to generate and keep your music.
          </h1>
        </div>
        <AuthForm />
      </div>
    </section>
  );
}
