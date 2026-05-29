import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo = null;

export function getEcho() {
  if (echo) return echo;

  if (typeof window !== "undefined") {
    // Silence pusher-js's default alert() on connection errors
    Pusher.log = () => {};
    window.Pusher = Pusher;
  }

  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") === "https",
    enabledTransports: ["ws", "wss"],
    disableStats: true,
    // Don't throw alerts on connection failure — we handle reconnect silently
    activityTimeout: 30000,
    pongTimeout: 15000,
  });

  return echo;
}
