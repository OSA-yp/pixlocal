import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "PixLocal — compress photos in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(180deg, #f3f6f2 0%, #e4ece3 100%)",
          color: "#14201a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0f6b5c",
              color: "#f3f6f2",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 28, color: "#3d5248" }}>in your browser</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            PixLocal
          </div>
          <div style={{ fontSize: 36, color: "#3d5248", maxWidth: 860 }}>
            Compress and convert photos — files never leave your device
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#0f6b5c" }}>
          HEIC · JPG · PNG · WebP · no sign-up
        </div>
      </div>
    ),
    { ...size },
  );
}
