import { brDay, defaults, optOut, type Lead, type Offer, type Profile } from "./prospector";

const today = brDay();
const ago = (n: number) => new Date(`${today}T15:00:00Z`).getTime() - n * 86400000;
const date = (n: number) => new Date(ago(n)).toISOString();
export const demoSettings = { ...defaults, cidade: "São Paulo", assinatura: "Equipe comercial" };
export const demoProfile: Profile = { nome: "Conta de demonstração", cargo: "Consultoria comercial", foto: "" };
export const demoOffers: Offer[] = [
  {
    id: "atendimento", user_id: "", created_at: date(8),
    nome: "Atendente de I.A no WhatsApp", para_quem: "Clínicas, salões e pet shops",
    dor: "Perguntas e pedidos de agendamento chegam quando a equipe está ocupada ou fora do horário.",
    resultado: "Responde perguntas comuns, encaminha pedidos de agendamento e passa casos específicos para a equipe.",
  },
  {
    id: "orcamentos", user_id: "", created_at: date(8),
    nome: "Acompanhamento de orçamentos", para_quem: "Lojas e prestadores de serviço",
    dor: "Orçamentos podem ficar sem retorno quando o dia a dia aperta.",
    resultado: "Organiza os pedidos e lembra a equipe de retomar conversas com clientes interessados.",
  },
];
const rows = [
  ["Clínica Aurora", "Clínica estética", "Vila Mariana", 4.9, 186],
  ["Studio Bela Forma", "Salão de beleza", "Moema", 4.8, 124],
  ["Odonto Prime", "Clínica odontológica", "Pinheiros", 4.9, 312],
  ["Casa Verde Pet", "Pet shop", "Vila Madalena", 4.9, 247],
  ["Ateliê Flora", "Floricultura", "Brooklin", 4.8, 163],
  ["Oficina Horizonte", "Oficina mecânica", "Santana", 4.7, 118],
] as const;
export const demo: Lead[] = [
  ...rows,
  ...Array.from(
    { length: 13 },
    (_, i) => [`Comércio local ${i + 1}`, "Comércio", "Centro", 4.5, 20 + i] as const,
  ),
].map(([nome, categoria, bairro, nota_google, avaliacoes_google], i) => {
  const status =
    i < 2
      ? "enviado"
      : i < 6 || i > 11
        ? "a_mandar"
        : i < 8
          ? "enviado"
          : i < 10
            ? "respondeu"
            : i < 11
              ? "reuniao"
              : "fechou";
  const id = String(i);
  return {
    company: {
      id,
      user_id: "",
      nome,
      categoria,
      bairro,
      cidade: "São Paulo",
      nota_google,
      avaliacoes_google,
      telefone: "",
      site: "",
      instagram: "",
      observacao: "",
      saiu: false,
      origem: "planilha",
      created_at: date(8),
    },
    contact: {
      id,
      user_id: "",
      empresa_id: id,
      status,
      created_at: date(8),
      enviado_em: status === "a_mandar" ? null : date(i < 2 ? 4 : 0),
      follow_up_em: i < 2 ? date(1).slice(0, 10) : null,
      respondeu_em: ["respondeu", "reuniao", "fechou"].includes(status) ? date(0) : null,
      reuniao_em: ["reuniao", "fechou"].includes(status) ? date(0) : null,
      anotacao: "",
      sistema_sugerido: i < 4 ? "Atendente de I.A no WhatsApp" : "Acompanhamento de orçamentos",
      mensagem: `Oi, equipe da ${nome}! Vi que vocês ficam em ${bairro}.\nEm muitos negócios locais, as mensagens chegam quando a equipe já encerrou o dia.\nPosso mostrar como um atendente de I.A funcionaria com o nome de vocês?\n${optOut}`,
      follow_up: `Oi, equipe da ${nome}! Se fizer sentido, ainda posso mostrar a ideia rapidinho.`,
    },
  };
});
