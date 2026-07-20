import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const titleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 15, fps, config: { damping: 20 } }), [0, 1], [50, 0]);
  const subOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{
      fontFamily,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #F5F0EB 0%, #EDE5DB 100%)",
    }}>
      {/* App icon */}
      <div style={{
        transform: `scale(${logoScale})`,
        width: 130,
        height: 130,
        borderRadius: 32,
        background: "linear-gradient(135deg, #A0826D, #8B6F5C)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 20px 60px rgba(160,130,109,0.35)",
        marginBottom: 40,
      }}>
        <span style={{ fontSize: 64 }}>📊</span>
      </div>

      <div style={{
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        fontSize: 52,
        fontWeight: 800,
        color: "#3D2B1F",
        textAlign: "center",
        lineHeight: 1.15,
      }}>
        Como funciona<br/>o app?
      </div>

      <div style={{
        opacity: subOp,
        fontSize: 24,
        color: "#8B7355",
        marginTop: 16,
        fontWeight: 600,
      }}>
        Veja cada função na prática
      </div>

      {/* Decorative dots */}
      <div style={{
        display: "flex",
        gap: 10,
        marginTop: 40,
        opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: i === 0 ? "#A0826D" : "#D4C4B0",
          }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
