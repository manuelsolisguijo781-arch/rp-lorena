import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webPush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// VAPID keys for Web Push authentication (RFC 8291/8292)
const VAPID_PUBLIC_KEY =
  Deno.env.get("VAPID_PUBLIC_KEY") ||
  "BBFHk0URTmA6TXo_ZQX6XgzTEbdRIvfpIlFaVfaWnYMHI3WpZMos4l--Dk5OmJePidfwQ6rEiP3k0gO1B6kjIzo";
const VAPID_PRIVATE_KEY =
  Deno.env.get("VAPID_PRIVATE_KEY") ||
  "EszYM7JioBQT9P0EUhkV_TgLxlhpAutZ5dncAmpbt6c";
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") ||
  "mailto:roleplay-app@antigravity.dev";

try {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.error("VAPID init error:", e);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json().catch(() => ({}));

    // Support both Supabase Database Webhooks ({ type: 'INSERT', record: { ... } })
    // and direct client invocation ({ roomId, senderId, senderName, content })
    let roomId = rawBody.roomId;
    let senderId = rawBody.senderId;
    let senderName = rawBody.senderName || "Crónicas de Rol ✨";
    let content = rawBody.content || "💬 Nuevo mensaje en la historia.";

    // If triggered by a Supabase Database Webhook on table 'messages'
    if (rawBody.record) {
      roomId = rawBody.record.room_id;
      senderId = rawBody.record.character_id;
      senderName = rawBody.record.character_name || senderName;
      content = rawBody.record.content || (rawBody.record.image_url ? "📷 Te ha enviado una foto" : "🎲 Ha lanzado los dados");
    }

    if (!roomId) {
      return new Response(JSON.stringify({ error: "Missing roomId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || "https://prgmytgvueopakwzppge.supabase.co";
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      "sb_publishable_SLga2tSRZmZc4pgAXRQ4IQ_Qh9u7FR4";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch room members (from characters table: name = roomId, vision = 'member')
    const { data: memberRows } = await supabase
      .from("characters")
      .select("title")
      .eq("name", roomId)
      .eq("vision", "member");

    // Also check room creator in rooms table
    const { data: roomRow } = await supabase
      .from("rooms")
      .select("region")
      .eq("id", roomId)
      .maybeSingle();

    const targetUserIds = new Set<string>();

    if (memberRows) {
      for (const m of memberRows) {
        if (m.title && m.title !== senderId) {
          targetUserIds.add(m.title);
        }
      }
    }

    // 2. Fetch push subscriptions for those users
    const subscriptions: any[] = [];

    // Query characters table for stored push tokens (id: 'push_' + userId)
    const { data: pushRows } = await supabase
      .from("characters")
      .select("name, avatar_url")
      .eq("vision", "push_sub");

    if (pushRows) {
      for (const p of pushRows) {
        // Exclude the sender so they don't notify themselves
        if (p.name === senderId) continue;

        try {
          const parsed = JSON.parse(p.avatar_url);
          if (parsed && parsed.endpoint) {
            subscriptions.push(parsed);
          }
        } catch {
          // ignore invalid json
        }
      }
    }

    // Also check dedicated push_subscriptions table if created
    try {
      const { data: directSubs } = await supabase
        .from("push_subscriptions")
        .select("user_id, subscription");

      if (directSubs) {
        for (const s of directSubs) {
          if (s.user_id !== senderId && s.subscription && s.subscription.endpoint) {
            subscriptions.push(s.subscription);
          }
        }
      }
    } catch {
      // table might not exist
    }

    // Deduplicate subscriptions by endpoint
    const uniqueSubs = new Map<string, any>();
    for (const sub of subscriptions) {
      if (sub.endpoint && !uniqueSubs.has(sub.endpoint)) {
        uniqueSubs.set(sub.endpoint, sub);
      }
    }

    if (uniqueSubs.size === 0) {
      return new Response(
        JSON.stringify({ message: "No active push subscriptions found for other members", targets: Array.from(targetUserIds) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationPayload = JSON.stringify({
      title: `${senderName} ✨`,
      body: content.length > 120 ? content.substring(0, 117) + "..." : content,
      tag: `rp-${roomId}-${Date.now()}`,
      url: "/rp-lorena/",
    });

    // 3. Send Web Push to all registered device endpoints
    const results = await Promise.allSettled(
      Array.from(uniqueSubs.values()).map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys?.p256dh || sub.p256dh,
              auth: sub.keys?.auth || sub.auth,
            },
          },
          notificationPayload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r: any) => r.reason?.message || "Unknown push error");

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        total: uniqueSubs.size,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
