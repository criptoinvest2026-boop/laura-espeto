import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });

const sections = ["Dashboard", "Vendas", "Produtos", "Clientes", "Custos", "Relatórios"];

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainScale = spring({ frame, fps, config: { damping: 12 } });
  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{
      fontFamily,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #F5F0EB 0%, #EDE5DB 100%)",
    }}>
      <div style={{
        opacity: titleOp,
        transform: `scale(${mainScale})`,
        textAlign: "center",
      }}>
        <div style={{
          width: 100,
          height: 100,
          borderRadius: 25,
          background: "linear-gradient(135deg, #A0826D, #8B6F5C)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 30px",
          boxShadow: "0 15px 50px rgba(160,130,109,0.3)",
        }}>
          <span style={{ fontSize: 50 }}>✅</span>
        </div>

        <div style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#3D2B1F",
          lineHeight: 1.2,
        }}>
          Tudo que você<br/>precisa!
        </div>
      </div>

      {/* Feature chips */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 12,
        marginTop: 50,
        maxWidth: 800,
        padding: "0 40px",
      }}>
        {sections.map((s, i) => {
          const delay = 20 + i * 7;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const op = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const scale = interpolate(sp, [0, 1], [0.5, 1]);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `scale(${scale})`,
              background: "#A0826D",
              borderRadius: 30,
              padding: "14px 28px",
              fontSize: 18,
              color: "white",
              fontWeight: 700,
            }}>
              {s}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 60,
        opacity: interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 22,
        color: "#8B7355",
        fontWeight: 600,
      }}>
        Comece agora! 🚀
      </div>
    </AbsoluteFill>
  );
};
