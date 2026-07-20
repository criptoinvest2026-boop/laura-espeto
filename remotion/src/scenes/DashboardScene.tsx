import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const stats = [
  { label: "Receita Bruta", value: "R$ 12.450", icon: "💰", color: "#8B5CF6" },
  { label: "Custos", value: "R$ 3.200", icon: "📉", color: "#F43F5E" },
  { label: "Lucro Líquido", value: "R$ 9.250", icon: "💎", color: "#10B981" },
  { label: "Pendentes", value: "R$ 1.800", icon: "⏳", color: "#F59E0B" },
];

export const DashboardScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headerY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [-40, 0]);

  return (
    <AbsoluteFill style={{
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(16,185,129,0.1) 0%, transparent 40%)",
    }}>
      {/* Section label */}
      <div style={{
        opacity: headerOp,
        transform: `translateY(${headerY}px)`,
        fontSize: 18,
        fontWeight: 600,
        color: "#8B5CF6",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        marginBottom: 8,
      }}>
        📊 Dashboard
      </div>

      <div style={{
        opacity: headerOp,
        transform: `translateY(${headerY}px)`,
        fontSize: 42,
        fontWeight: 800,
        color: "white",
        marginBottom: 50,
        lineHeight: 1.2,
      }}>
        Visão geral do<br />seu negócio
      </div>

      {/* Stats cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {stats.map((stat, i) => {
          const delay = 15 + i * 10;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120 } });
          const cardOp = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const cardX = interpolate(s, [0, 1], [80, 0]);

          return (
            <div key={i} style={{
              opacity: cardOp,
              transform: `translateX(${cardX}px)`,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 20,
              padding: "28px 30px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              borderLeft: `4px solid ${stat.color}`,
              backdropFilter: "none",
            }}>
              <span style={{ fontSize: 40 }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 32, color: "white", fontWeight: 800 }}>
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature description */}
      <div style={{
        marginTop: 40,
        opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 18,
        color: "rgba(255,255,255,0.4)",
        fontWeight: 400,
        lineHeight: 1.6,
      }}>
        Acompanhe receita, custos, lucro e pagamentos pendentes em tempo real
      </div>
    </AbsoluteFill>
  );
};
