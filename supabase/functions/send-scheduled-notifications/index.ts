// Supabase Edge Function: send-scheduled-notifications
// Dipanggil oleh pg_cron setiap menit untuk mengirim notifikasi terjadwal
//
// Deploy:
//   npx supabase functions deploy send-scheduled-notifications --no-verify-jwt
//
// Setup pg_cron di SQL Editor:
//   SELECT cron.schedule('send_scheduled_notifs', '* * * * *',
//     $$SELECT net.http_post(
//       url := 'https://mnjthnylygqxxgymakse.supabase.co/functions/v1/send-scheduled-notifications',
//       headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb
//     )$$
//   );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- JWT helper (sama dengan send-notification) ---
async function getAccessToken(
  serviceAccount: {
    client_email: string;
    private_key: string;
    token_uri: string;
    project_id: string;
  }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encoder = new TextEncoder();
  const toBase64Url = (data: Uint8Array): string => {
    let binary = "";
    for (const byte of data) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const headerB64 = toBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(unsignedToken))
  );

  const signedToken = `${unsignedToken}.${toBase64Url(signature)}`;

  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedToken,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
  }
  return (await tokenResponse.json()).access_token;
}

async function sendFCM(
  accessToken: string,
  projectId: string,
  title: string,
  message: string,
  topic: string
): Promise<boolean> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const resp = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        topic: topic || "all_users",
        notification: { title, body: message },
        android: {
          priority: "high",
          notification: { sound: "default", channel_id: "mass_fm_notifications" },
        },
      },
    }),
  });
  return resp.ok;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Init Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Ambil notifikasi yang pending dan waktunya sudah tiba
    const now = new Date().toISOString();
    const { data: pendingNotifs, error: fetchError } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    if (!pendingNotifs || pendingNotifs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Tidak ada notifikasi yang perlu dikirim", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Load Firebase service account
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT secret belum di-set");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    let sentCount = 0;

    // 4. Proses setiap notifikasi
    for (const notif of pendingNotifs) {
      try {
        const sent = await sendFCM(
          accessToken,
          serviceAccount.project_id,
          notif.title,
          notif.body,
          notif.topic
        );

        if (sent) {
          // Update status jadi 'sent'
          await supabase
            .from("scheduled_notifications")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", notif.id);

          // Log ke tabel notifications (riwayat)
          await supabase.from("notifications").insert({
            title: notif.title,
            body: notif.body,
            topic: notif.topic,
            sent_by: "scheduled",
          });

          // Jika ada pengulangan, buat jadwal baru
          if (notif.repeat_type === "daily" || notif.repeat_type === "weekly") {
            const nextDate = new Date(notif.scheduled_at);
            if (notif.repeat_type === "daily") {
              nextDate.setDate(nextDate.getDate() + 1);
            } else {
              nextDate.setDate(nextDate.getDate() + 7);
            }

            await supabase.from("scheduled_notifications").insert({
              title: notif.title,
              body: notif.body,
              topic: notif.topic,
              scheduled_at: nextDate.toISOString(),
              status: "pending",
              repeat_type: notif.repeat_type,
            });
          }

          sentCount++;
        } else {
          console.error(`FCM failed for notif #${notif.id}`);
        }
      } catch (err) {
        console.error(`Error processing notif #${notif.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${sentCount}/${pendingNotifs.length} notifikasi terkirim`,
        sent: sentCount,
        total: pendingNotifs.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
