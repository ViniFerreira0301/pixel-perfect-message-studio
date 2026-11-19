import { describe, expect, it } from "vitest";
import { demo } from "@/lib/demo";
import { normalizePhone, parseRows, queue, type Lead } from "@/lib/prospector";
const lead = (n: number, overrides: Partial<Lead["contact"]> = {}): Lead => {
  const base = demo[0];
  if (!base) throw new Error("Missing lead fixture");
  return {
    company: { ...base.company, id: String(n), avaliacoes_google: n, saiu: false },
    contact: {
      ...base.contact,
      id: String(n),
      status: "a_mandar",
      enviado_em: null,
      follow_up_em: null,
      ...overrides,
    },
  };
};
describe("Regras de prospecção", () => {
  it("normaliza com 55 e rejeita telefone fixo claro", () => {
    expect(normalizePhone("(11) 98765-4321")).toEqual({ phone: "5511987654321" });
    expect(normalizePhone("+55 (11) 3765-4321")).toEqual({ reason: "Telefone fixo" });
  });
  it("deduplica pelo telefone e aceita os dois formatos", () => {
    const result = parseRows(
      [
        { title: "Aurora", phone: "+55 11 98765-4321" },
        { nome: "Outra", telefone: "(11) 98765-4321" },
        { nome: "Bela", telefone: "21 91234-5678" },
      ],
      [],
    );
    expect(result.valid.map(({ nome, telefone }) => [nome, telefone])).toEqual([
      ["Aurora", "5511987654321"],
      ["Bela", "5521912345678"],
    ]);
    expect(result.rejected).toEqual({ "Telefone duplicado": 1 });
  });
  it("limita a vinte primeiras mensagens por dia", () => {
    const candidates = Array.from({ length: 23 }, (_, i) => lead(i));
    const today = queue(
      [...candidates, lead(30, { status: "enviado", enviado_em: "2026-11-19T13:00:00Z" })],
      undefined,
      "2026-11-19",
    );
    expect(today.remaining).toBe(19);
    expect(today.first).toHaveLength(19);
  });
  it("prioriza empresas com mais avaliações quando as notas são iguais", () => {
    expect(queue([lead(3), lead(90)], 20, "2026-11-19").first.map((l) => l.company.id)).toEqual([
      "90",
      "3",
    ]);
  });
  it("mostra follow-up em três dias somente sem resposta", () => {
    const waiting = lead(1, {
      status: "enviado",
      enviado_em: "2026-11-16T13:00:00Z",
      follow_up_em: "2026-11-19",
    });
    const replied = lead(2, { status: "respondeu", follow_up_em: "2026-11-19" });
    expect(queue([waiting, replied], 0, "2026-11-18").follow).toEqual([]);
    expect(queue([waiting, replied], 0, "2026-11-19").follow).toEqual([waiting]);
  });
  it("exclui quem pediu para sair mesmo com follow-up vencido", () => {
    const first = lead(1);
    const follow = lead(2, { status: "enviado", follow_up_em: "2026-11-19" });
    first.company.saiu = true;
    follow.company.saiu = true;
    expect(queue([first, follow], 20, "2026-11-19")).toEqual({
      opened: 0,
      remaining: 20,
      first: [],
      follow: [],
    });
  });
});
