import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f6b5c",
          color: "#f3f6f2",
          fontSize: 108,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        П
      </div>
    ),
    { ...size },
  );
}
