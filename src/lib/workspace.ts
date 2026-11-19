import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaults, type Lead, type Offer, type Profile } from "./prospector";

async function paginate<T>(
  get: (
    start: number,
    end: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const all: T[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await get(start, start + 499);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) return all;
  }
}
export type WorkspaceData = {
  leads: Lead[];
  offers: Offer[];
  settings: typeof defaults;
  profile: Profile;
};
export const workspaceQuery = (userId: string) =>
  queryOptions({
    queryKey: ["workspace", userId],
    queryFn: async (): Promise<WorkspaceData> => {
      const [companies, contacts, offers, config, profile] = await Promise.all([
        paginate((a, b) => supabase.from("empresas").select().order("id").range(a, b)),
        paginate((a, b) => supabase.from("contatos").select().order("id").range(a, b)),
        paginate((a, b) => supabase.from("ofertas").select().order("id").range(a, b)),
        supabase.from("configuracoes").select("chave,valor"),
        supabase.from("profiles").select("nome,foto,cargo").eq("id", userId).single(),
      ]);
      if (config.error || profile.error)
        throw new Error("Não foi possível carregar sua conta. Tente novamente.");
      const mapped = new Map(contacts.map((c) => [c.empresa_id, c]));
      const leads = companies.flatMap((company) => {
        const contact = mapped.get(company.id);
        return contact ? [{ company, contact }] : [];
      });
      return {
        leads,
        offers,
        settings: {
          ...defaults,
          ...Object.fromEntries(config.data.map(({ chave, valor }) => [chave, valor])),
        },
        profile: profile.data,
      };
    },
  });
