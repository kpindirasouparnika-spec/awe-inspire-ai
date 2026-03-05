import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "system", content: "You are an image generation AI. Generate an image based on the user's description. Be creative and produce high-quality visuals." },
          { role: "user", content: `Generate an image: ${prompt}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract image data from the response
    const content = data.choices?.[0]?.message?.content;
    
    // Check if the response contains inline image data
    let imageData = null;
    let textContent = null;
    
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image" || part.type === "image_url") {
          imageData = part.image_url?.url || part.data || part.url;
        } else if (part.type === "text") {
          textContent = part.text;
        }
      }
    } else if (typeof content === "string") {
      // Check if content contains base64 image data
      const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match) {
        imageData = base64Match[0];
      } else {
        textContent = content;
      }
    }
    
    // Also check for inline_data in the raw response
    if (!imageData && data.choices?.[0]?.message?.content) {
      // The gateway might return the raw Gemini format
      const rawContent = data.choices[0].message;
      if (rawContent.parts) {
        for (const part of rawContent.parts) {
          if (part.inline_data) {
            imageData = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      image: imageData,
      text: textContent,
      raw: !imageData ? data : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("image-gen error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
