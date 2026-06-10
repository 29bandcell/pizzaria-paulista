export default async (_req: Request) => {
  const supabaseUrl = Netlify.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Netlify.env.get("SUPABASE_ANON_KEY") || "";

  return new Response(JSON.stringify({ supabaseUrl, supabaseAnonKey }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
};

export const config = {
  path: "/api/config",
  method: ["GET"]
};
