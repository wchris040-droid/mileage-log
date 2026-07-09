// worker.js
// Deploy this in Cloudflare Workers (free tier). It keeps your Anthropic API key
// server-side so it never sits inside the app's code where anyone could see it.
//
// SETUP:
// 1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
// 2. Delete the default code, paste this file in, click Deploy
// 3. Go to Settings -> Variables and Secrets -> Add
//      Name: ANTHROPIC_API_KEY
//      Value: (your key from https://console.anthropic.com/settings/keys)
//      Make sure it's added as a "Secret", not plain text
// 4. Save and re-deploy. Copy the worker's URL (looks like
//    https://mileage-ocr.YOUR-SUBDOMAIN.workers.dev) into OCR_ENDPOINT
//    in index.html.

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server is missing ANTHROPIC_API_KEY. Add it in Worker Settings -> Variables and Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const { image, mediaType } = await request.json();
      if (!image) {
        return new Response(JSON.stringify({ error: "No image provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
                {
                  type: "text",
                  text:
                    'This is a photo of a car dashboard or odometer. Find the main total odometer reading (not the trip meter, not the speedometer, not RPM/fuel gauges). Respond with ONLY raw JSON, no markdown fences, no extra text, in exactly this shape: {"mileage": <integer or null>, "found": <true or false>}. If you cannot clearly read a total odometer number, return {"mileage": null, "found": false}.',
                },
              ],
            },
          ],
        }),
      });

      const data = await anthropicRes.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
