import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const features = [
  { icon: "📈", text: "Gráficos de vendas x custos" },
  { icon: "🏆", text: "Ranking de produtos" },
  { icon: "👥", text: "Top clientes" },
  { icon: "⏳", text: "Pedidos pendentes" },
  { icon: "📤", text: "Exportar para CSV" },
];

export const ReportsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 40%)",
    }}>
      <div style={{
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 18,
        fontWeight: 600,
        color: "#818CF8",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        marginBottom: 8,
      }}>
        📊 Relatórios
      </div>

      <div style={{
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 42,
        fontWeight: 800,
        color: "white",
        marginBottom: 50,
        lineHeight: 1.2,
      }}>
        Análises e<br/>insights
      </div>

      {/* Fake chart bars */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        height: 140,
        marginBottom: 40,
        padding: "0 20px",
      }}>
        {[60, 85, 45, 100, 70, 90, 55].map((h, i) => {
          const delay = 10 + i * 5;
          const barH = interpolate(
            spring({ frame: frame - delay, fps, config: { damping: 12 } }),
            [0, 1], [0, h * 1.3]
          );
          return (
            <div key={i} style={{
              flex: 1,
              height: barH,
              background: `linear-gradient(180deg, #8B5CF6, #6D28D9)`,
              borderRadius: "8px 8px 0 0",
              opacity: 0.7 + (i % 2) * 0.3,
            }} />
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {features.map((f, i) => {
          const delay = 25 + i * 7;
          const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const x = interpolate(spring({ frame: frame - delay, fps, config: { damping: 20 } }), [0, 1], [40, 0]);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${x}px)`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
            }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <span style={{ fontSize: 20, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{f.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
