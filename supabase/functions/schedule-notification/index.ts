// Edge Function: schedule-notification
// Automatically sends push notifications for upcoming programs
// Can be triggered by pg_cron or external cron

import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (_req: Request) => {
  try {
    // 1. Check if auto-notify is enabled
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.auto_notify_enabled) {
      return new Response(
        JSON.stringify({ message: "Auto-notify disabled" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const notifyBeforeMinutes = settings.notify_before_minutes || 10;
    const topic = settings.notify_topic || "jadwal_update";

    // 2. Get today's schedules (using WIB date)
    const now = new Date();
    const wibOffset = 7 * 60;
    const wibMs = now.getTime() + (wibOffset + now.getTimezoneOffset()) * 60000;
    const wibDate = new Date(wibMs);
    const today = wibDate.toISOString().split("T")[0];
    const { data: schedules } = await supabase
      .from("schedules")
      .select("*")
      .eq("date", today)
      .order("jam", { ascending: true });

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ message: "No schedules today" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Find programs starting in X minutes
    // Reuse 'now' and 'wibOffset' from above
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const wibMinutes = utcMinutes + wibOffset;
    const currentHour = Math.floor(wibMinutes / 60) % 24;
    const currentMinute = wibMinutes % 60;
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const notificationsSent: string[] = [];

    for (const schedule of schedules) {
      // Parse start time from "HH:MM - HH:MM" or "HH.MM - HH.MM" format
      const normalizedJam = schedule.jam.replace(/\./g, ":");
      const startTime = normalizedJam.split(" - ")[0].trim();
      const [startH, startM] = startTime.split(":").map(Number);
      if (isNaN(startH) || isNaN(startM)) continue; // skip invalid format
      const scheduleTimeMinutes = startH * 60 + startM;

      // Calculate minutes until start
      const minutesUntil = scheduleTimeMinutes - currentTimeMinutes;

      // Send notification if within the window (e.g., 9-11 minutes for a 10-min setting)
      // This allows for ~2 minute cron tolerance
      if (minutesUntil >= (notifyBeforeMinutes - 1) && minutesUntil <= (notifyBeforeMinutes + 1)) {
        const title = `${notifyBeforeMinutes} menit lagi: ${schedule.program}`;
        const message = `${schedule.judul} bersama ${schedule.pemateri} (${schedule.jam} WIB)`;

        // Send via FCM
        try {
          const sendResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({ title, message, topic }),
            }
          );

          if (sendResponse.ok) {
            notificationsSent.push(schedule.judul);

            // Log to notifications table
            await supabase.from("notifications").insert({
              title,
              body: message,
              topic,
              sent_by: "auto",
            });
          }
        } catch (e) {
          console.error(`Failed to send for ${schedule.judul}:`, e);
        }
      }
    }

    // Update last sent timestamp
    if (notificationsSent.length > 0) {
      await supabase
        .from("notification_settings")
        .update({ last_auto_sent_at: new Date().toISOString() })
        .eq("id", settings.id);
    }

    return new Response(
      JSON.stringify({
        message: "OK",
        sent: notificationsSent.length,
        programs: notificationsSent,
        currentTime: `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")} WIB`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
