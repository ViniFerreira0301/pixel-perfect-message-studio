export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          user_id: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          user_id?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          user_id?: string
          valor?: string
        }
        Relationships: []
      }
      contatos: {
        Row: {
          anotacao: string
          created_at: string
          empresa_id: string
          enviado_em: string | null
          follow_up: string
          follow_up_em: string | null
          id: string
          mensagem: string
          respondeu_em: string | null
          reuniao_em: string | null
          sistema_sugerido: string
          status: string
          user_id: string
        }
        Insert: {
          anotacao?: string
          created_at?: string
          empresa_id: string
          enviado_em?: string | null
          follow_up?: string
          follow_up_em?: string | null
          id?: string
          mensagem?: string
          respondeu_em?: string | null
          reuniao_em?: string | null
          sistema_sugerido?: string
          status?: string
          user_id?: string
        }
        Update: {
          anotacao?: string
          created_at?: string
          empresa_id?: string
          enviado_em?: string | null
          follow_up?: string
          follow_up_em?: string | null
          id?: string
          mensagem?: string
          respondeu_em?: string | null
          reuniao_em?: string | null
          sistema_sugerido?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatos_user_id_empresa_id_fkey"
            columns: ["user_id", "empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      empresas: {
        Row: {
          avaliacoes_google: number | null
          bairro: string
          categoria: string
          cidade: string
          created_at: string
          id: string
          instagram: string
          nome: string
          nota_google: number | null
          observacao: string
          origem: string
          saiu: boolean
          site: string
          telefone: string
          user_id: string
        }
        Insert: {
          avaliacoes_google?: number | null
          bairro?: string
          categoria?: string
          cidade?: string
          created_at?: string
          id?: string
          instagram?: string
          nome: string
          nota_google?: number | null
          observacao?: string
          origem?: string
          saiu?: boolean
          site?: string
          telefone: string
          user_id?: string
        }
        Update: {
          avaliacoes_google?: number | null
          bairro?: string
          categoria?: string
          cidade?: string
          created_at?: string
          id?: string
          instagram?: string
          nome?: string
          nota_google?: number | null
          observacao?: string
          origem?: string
          saiu?: boolean
          site?: string
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          created_at: string
          criado_em: string
          detalhe: Json
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criado_em?: string
          detalhe?: Json
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          criado_em?: string
          detalhe?: Json
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      ofertas: {
        Row: {
          created_at: string
          dor: string
          id: string
          nome: string
          para_quem: string
          resultado: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dor: string
          id?: string
          nome: string
          para_quem: string
          resultado: string
          user_id?: string
        }
        Update: {
          created_at?: string
          dor?: string
          id?: string
          nome?: string
          para_quem?: string
          resultado?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cargo: string
          created_at: string
          foto: string
          id: string
          nome: string
        }
        Insert: {
          cargo?: string
          created_at?: string
          foto?: string
          id: string
          nome?: string
        }
        Update: {
          cargo?: string
          created_at?: string
          foto?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      prospector_action: {
        Args: {
          p_action: string
          p_follow?: string
          p_id: string
          p_offer?: string
          p_text?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
