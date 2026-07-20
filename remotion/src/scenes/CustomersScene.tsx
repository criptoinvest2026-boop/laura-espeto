import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const features = [
  { icon: "👤", text: "Cadastro completo", sub: "Nome, telefone, email" },
  { icon: "📱", text: "WhatsApp direto", sub: "Contato com 1 clique" },
  { icon: "📝", text: "Anotações", sub: "Observações por cliente" },
  { icon: "📊", text: "Histórico", sub: "Todas as compras do cliente" },
];

export const CustomersScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(59,130,246,0.1) 0%, transparent 40%)",
    }}>
      <div style={{
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 18,
        fontWeight: 600,
        color: "#3B82F6",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        marginBottom: 8,
      }}>
        👥 Clientes
      </div>

      <div style={{
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 42,
        fontWeight: 800,
        color: "white",
        marginBottom: 50,
        lineHeight: 1.2,
      }}>
        Seus clientes<br/>organizados
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {features.map((f, i) => {
          const delay = 10 + i * 10;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const x = interpolate(s, [0, 1], [-60, 0]);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${x}px)`,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 18,
              padding: "22px 26px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              borderRight: "3px solid rgba(59,130,246,0.3)",
            }}>
              <span style={{ fontSize: 36 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 20, color: "white", fontWeight: 700 }}>{f.text}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{f.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
