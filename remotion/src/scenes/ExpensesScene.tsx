import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const features = [
  { icon: "📋", text: "Registrar custos", color: "#F43F5E" },
  { icon: "🏷️", text: "Categorias de despesas", color: "#F97316" },
  { icon: "📅", text: "Controle por data", color: "#EAB308" },
  { icon: "📊", text: "Relatório mensal", color: "#8B5CF6" },
];

export const ExpensesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(244,63,94,0.1) 0%, transparent 40%)",
    }}>
      <div style={{
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 18,
        fontWeight: 600,
        color: "#F43F5E",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        marginBottom: 8,
      }}>
        💸 Custos
      </div>

      <div style={{
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 42,
        fontWeight: 800,
        color: "white",
        marginBottom: 50,
        lineHeight: 1.2,
      }}>
        Controle suas<br/>despesas
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {features.map((f, i) => {
          const delay = 10 + i * 10;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
          const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const y = interpolate(s, [0, 1], [50, 0]);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${y}px)`,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 18,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              borderBottom: `3px solid ${f.color}30`,
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: 13,
                background: `${f.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}>
                {f.icon}
              </div>
              <span style={{ fontSize: 22, color: "white", fontWeight: 600 }}>{f.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
