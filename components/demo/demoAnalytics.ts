"use client";

export type DemoMode = "visitor" | "dashboard";

export type DemoEventName =
  | "demo_view"
  | "demo_choose_visitor"
  | "demo_choose_dashboard"
  | "visitor_home_view"
  | "visitor_action_view"
  | "visitor_tip_submit"
  | "visitor_reward_view"
  | "reward_coupon_click"
  | "reward_wallet_save"
  | "dashboard_home_view"
  | "dashboard_create_view"
  | "dashboard_setup_view"
  | "dashboard_contact_click"
  | "demo_showcase_view"
  | "demo_contact_click";

type MetadataValue = string | number | boolean | null;

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export async function trackDemoEvent(eventName: DemoEventName, metadata: Record<string, MetadataValue> = {}, mode?: DemoMode | null) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/demo/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        mode: mode ?? null,
        metadata: {
          ...metadata,
          path: window.location.pathname,
          device_type: getDeviceType(),
          viewport_width: window.innerWidth,
        },
      }),
      keepalive: true,
    });
  } catch (error) {
    console.error("[demo analytics] event failed", { eventName, error });
  }
}
