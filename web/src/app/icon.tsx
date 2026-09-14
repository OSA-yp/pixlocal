import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        П
      </div>
    ),
    { ...size },
  );
}
