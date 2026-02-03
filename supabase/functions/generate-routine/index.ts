import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const headers = { "Content-Type": "application/json" };

serve(() => {
  // This function was removed from the public API and is intentionally deprecated.
  return new Response(JSON.stringify({ error: "generate-routine is deprecated" }), { status: 410, headers });
});
