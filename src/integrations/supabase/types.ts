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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      apex_journal: {
        Row: {
          body: string | null
          contract: string | null
          created_at: string
          detail: Json
          id: string
          kind: string
          symbol: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          contract?: string | null
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          symbol?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          contract?: string | null
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          symbol?: string | null
          user_id?: string
        }
        Relationships: []
      }
      apex_market_state: {
        Row: {
          kind: string
          model_version: number
          payload: Json
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          kind: string
          model_version?: number
          payload?: Json
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          kind?: string
          model_version?: number
          payload?: Json
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apex_signals: {
        Row: {
          confidence: number | null
          contract: string
          created_at: string
          danger: number | null
          edge: number | null
          entry_condition: string | null
          freshness: number | null
          id: string
          opportunity_score: number | null
          outcome: string | null
          quality: number | null
          reasons: Json
          regime: string | null
          simulator_validation: number | null
          stability: number | null
          symbol: string
          threat_digit: number | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          contract: string
          created_at?: string
          danger?: number | null
          edge?: number | null
          entry_condition?: string | null
          freshness?: number | null
          id?: string
          opportunity_score?: number | null
          outcome?: string | null
          quality?: number | null
          reasons?: Json
          regime?: string | null
          simulator_validation?: number | null
          stability?: number | null
          symbol: string
          threat_digit?: number | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          contract?: string
          created_at?: string
          danger?: number | null
          edge?: number | null
          entry_condition?: string | null
          freshness?: number | null
          id?: string
          opportunity_score?: number | null
          outcome?: string | null
          quality?: number | null
          reasons?: Json
          regime?: string | null
          simulator_validation?: number | null
          stability?: number | null
          symbol?: string
          threat_digit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      apex_sim_trades: {
        Row: {
          contract: string
          created_at: string
          danger: number | null
          detail: Json
          duration_ticks: number
          entry_at: string
          entry_condition: string
          entry_digit: number | null
          entry_tick: number | null
          freshness: number | null
          id: string
          lesson: string | null
          outcome: string | null
          payout: number | null
          pnl: number | null
          regime: string | null
          resolution_digit: number | null
          resolved_at: string | null
          score: number | null
          stability: number | null
          stake: number
          symbol: string
          threat_digit: number | null
          user_id: string
        }
        Insert: {
          contract: string
          created_at?: string
          danger?: number | null
          detail?: Json
          duration_ticks?: number
          entry_at: string
          entry_condition?: string
          entry_digit?: number | null
          entry_tick?: number | null
          freshness?: number | null
          id?: string
          lesson?: string | null
          outcome?: string | null
          payout?: number | null
          pnl?: number | null
          regime?: string | null
          resolution_digit?: number | null
          resolved_at?: string | null
          score?: number | null
          stability?: number | null
          stake?: number
          symbol: string
          threat_digit?: number | null
          user_id: string
        }
        Update: {
          contract?: string
          created_at?: string
          danger?: number | null
          detail?: Json
          duration_ticks?: number
          entry_at?: string
          entry_condition?: string
          entry_digit?: number | null
          entry_tick?: number | null
          freshness?: number | null
          id?: string
          lesson?: string | null
          outcome?: string | null
          payout?: number | null
          pnl?: number | null
          regime?: string | null
          resolution_digit?: number | null
          resolved_at?: string | null
          score?: number | null
          stability?: number | null
          stake?: number
          symbol?: string
          threat_digit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      auto_trade_settings: {
        Row: {
          demo_only: boolean
          duration_ticks: number
          enabled: boolean
          max_consecutive_losses: number
          max_daily_loss: number | null
          min_confidence: number
          sources: Json
          stake: number
          stop_loss: number | null
          take_profit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          demo_only?: boolean
          duration_ticks?: number
          enabled?: boolean
          max_consecutive_losses?: number
          max_daily_loss?: number | null
          min_confidence?: number
          sources?: Json
          stake?: number
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          demo_only?: boolean
          duration_ticks?: number
          enabled?: boolean
          max_consecutive_losses?: number
          max_daily_loss?: number | null
          min_confidence?: number
          sources?: Json
          stake?: number
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deriv_accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_virtual: boolean
          loginid: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          loginid: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          loginid?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deriv_connected: boolean
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deriv_connected?: boolean
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deriv_connected?: boolean
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          auto_trade: boolean
          barrier: string | null
          closed_at: string | null
          contract_id: string
          contract_type: string
          created_at: string
          deriv_account_id: string | null
          duration: number | null
          duration_unit: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          is_virtual: boolean
          loginid: string | null
          meta: Json
          payout: number | null
          profit: number | null
          purchased_at: string
          signal_source: string | null
          stake: number
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          auto_trade?: boolean
          barrier?: string | null
          closed_at?: string | null
          contract_id: string
          contract_type: string
          created_at?: string
          deriv_account_id?: string | null
          duration?: number | null
          duration_unit?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          is_virtual?: boolean
          loginid?: string | null
          meta?: Json
          payout?: number | null
          profit?: number | null
          purchased_at?: string
          signal_source?: string | null
          stake?: number
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          auto_trade?: boolean
          barrier?: string | null
          closed_at?: string | null
          contract_id?: string
          contract_type?: string
          created_at?: string
          deriv_account_id?: string | null
          duration?: number | null
          duration_unit?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          is_virtual?: boolean
          loginid?: string | null
          meta?: Json
          payout?: number | null
          profit?: number | null
          purchased_at?: string
          signal_source?: string | null
          stake?: number
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_deriv_account_id_fkey"
            columns: ["deriv_account_id"]
            isOneToOne: false
            referencedRelation: "deriv_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          alert_sound: boolean
          max_daily_loss: number | null
          max_stake: number | null
          min_confidence: number
          risk_profile: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_sound?: boolean
          max_daily_loss?: number | null
          max_stake?: number | null
          min_confidence?: number
          risk_profile?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_sound?: boolean
          max_daily_loss?: number | null
          max_stake?: number | null
          min_confidence?: number
          risk_profile?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
