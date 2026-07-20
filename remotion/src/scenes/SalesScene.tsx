import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const features = [
  { icon: "➕", text: "Registrar novas vendas" },
  { icon: "📅", text: "Navegar por mês" },
  { icon: "✏️", text: "Editar vendas anteriores" },
  { icon: "🔍", text: "Busca e filtros" },
  { icon: "💳", text: "Status de pagamento" },
  { icon: "🔔", text: "Notificações em tempo real" },
];

export const SalesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(139,92,246,0.12) 0%, transparent 40%)",
    }}>
      <div style={{
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [-30, 0])}px)`,
        fontSize: 18,
        fontWeight: 600,
        color: "#10B981",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        marginBottom: 8,
      }}>
        🛒 Vendas
      </div>

      <div style={{
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 42,
        fontWeight: 800,
        color: "white",
        marginBottom: 50,
        lineHeight: 1.2,
      }}>
        Controle total<br/>das suas vendas
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {features.map((f, i) => {
          const delay = 10 + i * 8;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const x = interpolate(s, [0, 1], [60, 0]);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${x}px)`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: "rgba(255,255,255,0.05)",
              padding: "20px 24px",
              borderRadius: 16,
            }}>
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <span style={{ fontSize: 22, color: "white", fontWeight: 600 }}>{f.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
