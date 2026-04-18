import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { PageHeading } from "@/components/page-heading";
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
        <PageHeading
          eyebrow="Account"
          title="Sign in to generate and keep your music."
          align="center"
        />
        <AuthForm />
      </div>
    </section>
  );
}
