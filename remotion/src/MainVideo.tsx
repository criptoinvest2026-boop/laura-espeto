import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ScreenShowcase } from "./scenes/ScreenShowcase";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";

const TRANSITION = 25;
const timing = springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION });

const screens = [
  {
    image: "images/dashboard.png",
    title: "Dashboard",
    subtitle: "Visão completa do seu negócio",
    bullets: ["Receita e custos do mês", "Lucro líquido em tempo real", "Pagamentos pendentes", "Margem de lucro"],
    accent: "#8B5CF6",
  },
  {
    image: "images/sales.png",
    title: "Vendas",
    subtitle: "Registre e gerencie vendas",
    bullets: ["Nova venda em 1 clique", "Filtros e busca rápida", "Seletor de mês anterior", "Exportar para CSV"],
    accent: "#10B981",
  },
  {
    image: "images/products.png",
    title: "Produtos",
    subtitle: "Catálogo organizado",
    bullets: ["Categorias personalizadas", "Preço por unidade", "27 produtos cadastrados", "Busca e filtros"],
    accent: "#F59E0B",
  },
  {
    image: "images/customers.png",
    title: "Clientes",
    subtitle: "Sua base de clientes",
    bullets: ["265 clientes cadastrados", "Contato direto WhatsApp", "Histórico de compras", "Exportar dados"],
    accent: "#3B82F6",
  },
  {
    image: "images/expenses.png",
    title: "Custos",
    subtitle: "Controle de despesas",
    bullets: ["Categorias de gastos", "Embalagens, ingredientes...", "Valores por categoria", "Relatório integrado"],
    accent: "#F43F5E",
  },
  {
    image: "images/reports.png",
    title: "Relatórios",
    subtitle: "Análises completas",
    bullets: ["Gráficos de vendas x custos", "Ranking de produtos", "Pedidos pendentes", "Visão mensal detalhada"],
    accent: "#818CF8",
  },
];

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const bgHue = interpolate(frame, [0, 900], [25, 35]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, hsl(${bgHue}, 25%, 96%) 0%, hsl(${bgHue}, 20%, 92%) 100%)`,
    }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {screens.map((screen, i) => (
          <>
            <TransitionSeries.Sequence key={`screen-${i}`} durationInFrames={180}>
              <ScreenShowcase {...screen} />
            </TransitionSeries.Sequence>
            {i < screens.length - 1 && (
              <TransitionSeries.Transition
                key={`trans-${i}`}
                presentation={slide({ direction: i % 2 === 0 ? "from-right" : "from-left" })}
                timing={timing}
              />
            )}
            {i === screens.length - 1 && (
              <TransitionSeries.Transition
                key="trans-last"
                presentation={fade()}
                timing={timing}
              />
            )}
          </>
        ))}

        <TransitionSeries.Sequence durationInFrames={150}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
