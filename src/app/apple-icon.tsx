import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

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
          background: "#3d2e24",
          borderRadius: "36px",
          padding: "10px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "28px",
            border: "3px solid rgba(184, 107, 75, 0.85)",
            position: "relative",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, Times New Roman, serif",
              fontSize: "104px",
              fontWeight: 600,
              color: "#f6ece3",
              lineHeight: 1,
              marginTop: "-4px",
            }}
          >
            N
          </span>
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "9999px",
              background: "#b86b4b",
              position: "absolute",
              right: "28px",
              bottom: "32px",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
