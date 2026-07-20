import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const items = [
  { name: "Cadastro de produtos", desc: "Nome, preço, unidade e categoria", icon: "📦" },
  { name: "Categorias", desc: "Organize por tipo de produto", icon: "🏷️" },
  { name: "Ativar/Desativar", desc: "Controle produtos disponíveis", icon: "🔄" },
  { name: "Preços", desc: "Defina valores por unidade", icon: "💲" },
];

export const ProductsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(245,158,11,0.1) 0%, transparent 40%)",
    }}>
      <div style={{
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 18,
        fontWeight: 600,
        color: "#F59E0B",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        marginBottom: 8,
      }}>
        📦 Produtos
      </div>

      <div style={{
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        fontSize: 42,
        fontWeight: 800,
        color: "white",
        marginBottom: 50,
        lineHeight: 1.2,
      }}>
        Gerencie seu<br/>catálogo
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((item, i) => {
          const delay = 12 + i * 10;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const scale = interpolate(s, [0, 1], [0.8, 1]);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `scale(${scale})`,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 20,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(245,158,11,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, color: "white", fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", fontWeight: 400, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
