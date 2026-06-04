import { ImageResponse } from "next/og";
import { siteConfig } from "./utils/config";
// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#ffffff",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "20px solid #09090b", // Zinc-950 border
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        {/* Minimalist Logo/Brand */}
        <h1
          style={{
            fontSize: 100,
            fontFamily: "sans-serif",
            fontWeight: 800,
            color: "#09090b",
            margin: 0,
            letterSpacing: "-0.05em",
          }}
        >
          {siteConfig.name}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 42,
            fontFamily: "sans-serif",
            fontWeight: 500,
            color: "#52525b", // Zinc-500
            marginTop: 20,
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          The Intelligent Knowledge & Access Gateway
        </p>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
