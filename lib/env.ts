const requiredServerEnv = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "REPLICATE_API_TOKEN"
] as const;

export function requireEnv(name: (typeof requiredServerEnv)[number]) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
