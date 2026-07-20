import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

interface Props {
  image: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accent: string;
}

export const ScreenShowcase = ({ image, title, subtitle, bullets, accent }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headerY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [-30, 0]);

  const phoneScale = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 100 } });
  const phoneY = interpolate(spring({ frame: frame - 8, fps, config: { damping: 18 } }), [0, 1], [60, 0]);

  const floatY = Math.sin(frame * 0.04) * 3;

  return (
    <AbsoluteFill style={{
      fontFamily,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #F5F0EB 0%, #EDE5DB 100%)",
    }}>
      {/* Top section - title */}
      <div style={{
        padding: "50px 60px 0",
        opacity: headerOp,
        transform: `translateY(${headerY}px)`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 10,
        }}>
          <div style={{
            width: 8,
            height: 50,
            borderRadius: 4,
            background: accent,
          }} />
          <span style={{
            fontSize: 34,
            fontWeight: 700,
            color: accent,
            textTransform: "uppercase" as const,
            letterSpacing: 3,
          }}>
            {title}
          </span>
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#3D2B1F",
          lineHeight: 1.2,
        }}>
          {subtitle}
        </div>
      </div>

      {/* Phone mockup */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 20,
        transform: `scale(${phoneScale}) translateY(${phoneY + floatY}px)`,
        transformOrigin: "center top",
        flex: 1,
      }}>
        <div style={{
          width: 520,
          height: 1060,
          borderRadius: 50,
          background: "#1A1A1A",
          padding: 10,
          boxShadow: `0 40px 100px ${accent}40, 0 15px 50px rgba(0,0,0,0.2)`,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 160,
            height: 34,
            borderRadius: "0 0 20px 20px",
            background: "#1A1A1A",
            zIndex: 10,
          }} />
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: 40,
            overflow: "hidden",
            background: "#FFF",
          }}>
            <Img
              src={staticFile(image)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom bullets - larger */}
      <div style={{
        padding: "24px 60px 50px",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
      }}>
        {bullets.map((bullet, i) => {
          const delay = 30 + i * 10;
          const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const x = interpolate(
            spring({ frame: frame - delay, fps, config: { damping: 20 } }),
            [0, 1], [20, 0]
          );

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${x}px)`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: `${accent}15`,
              borderRadius: 22,
              padding: "12px 26px",
              border: `2px solid ${accent}30`,
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: accent,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 26,
                color: "#3D2B1F",
                fontWeight: 700,
              }}>
                {bullet}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
