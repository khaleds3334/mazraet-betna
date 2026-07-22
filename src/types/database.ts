// Generated from Supabase — do NOT hand-edit.
// Regenerate with: supabase gen types typescript (or via the Supabase MCP).
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          farm_id: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          farm_id: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          farm_id?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_credentials_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      customer: {
        Row: {
          auth_user_id: string | null
          created_at: string
          farm_id: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          farm_id: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle: {
        Row: {
          chick_count: number
          chick_price: number
          created_at: string
          ended_at: string | null
          farm_id: string
          id: string
          is_active: boolean
          sale_closes_at: string | null
          sale_open: boolean
          start_date: string
        }
        Insert: {
          chick_count: number
          chick_price?: number
          created_at?: string
          ended_at?: string | null
          farm_id: string
          id?: string
          is_active?: boolean
          sale_closes_at?: string | null
          sale_open?: boolean
          start_date: string
        }
        Update: {
          chick_count?: number
          chick_price?: number
          created_at?: string
          ended_at?: string | null
          farm_id?: string
          id?: string
          is_active?: boolean
          sale_closes_at?: string | null
          sale_open?: boolean
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      expense: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          cycle_id: string
          description: string | null
          farm_id: string
          id: string
          spent_on: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          cycle_id: string
          description?: string | null
          farm_id: string
          id?: string
          spent_on?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          cycle_id?: string
          description?: string | null
          farm_id?: string
          id?: string
          spent_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      farm: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          owner_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          owner_phone: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          owner_phone?: string
        }
        Relationships: []
      }
      feed: {
        Row: {
          bag_price: number
          bags: number
          created_at: string
          cycle_id: string
          farm_id: string
          id: string
          purchased_on: string
        }
        Insert: {
          bag_price?: number
          bags: number
          created_at?: string
          cycle_id: string
          farm_id: string
          id?: string
          purchased_on?: string
        }
        Update: {
          bag_price?: number
          bags?: number
          created_at?: string
          cycle_id?: string
          farm_id?: string
          id?: string
          purchased_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      mortality: {
        Row: {
          count: number
          created_at: string
          cycle_id: string
          died_on: string
          farm_id: string
          id: string
        }
        Insert: {
          count: number
          created_at?: string
          cycle_id: string
          died_on?: string
          farm_id: string
          id?: string
        }
        Update: {
          count?: number
          created_at?: string
          cycle_id?: string
          died_on?: string
          farm_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortality_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortality_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      notification: {
        Row: {
          audience: Database["public"]["Enums"]["notification_audience"]
          body: string | null
          created_at: string
          customer_id: string | null
          farm_id: string
          id: string
          is_read: boolean
          order_id: string | null
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string | null
          created_at?: string
          customer_id?: string | null
          farm_id: string
          id?: string
          is_read?: boolean
          order_id?: string | null
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string | null
          created_at?: string
          customer_id?: string | null
          farm_id?: string
          id?: string
          is_read?: boolean
          order_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_line: {
        Row: {
          actual_weight: number | null
          approx_weight: number | null
          batch_no: number
          cleaning: boolean
          created_at: string
          farm_id: string
          id: string
          order_id: string
          position: number
        }
        Insert: {
          actual_weight?: number | null
          approx_weight?: number | null
          batch_no?: number
          cleaning?: boolean
          created_at?: string
          farm_id: string
          id?: string
          order_id: string
          position?: number
        }
        Update: {
          actual_weight?: number | null
          approx_weight?: number | null
          batch_no?: number
          cleaning?: boolean
          created_at?: string
          farm_id?: string
          id?: string
          order_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_line_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_line_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          cleaning: boolean
          cleaning_price: number | null
          created_at: string
          customer_id: string | null
          cycle_id: string
          delivered_at: string | null
          farm_id: string
          id: string
          notes: string | null
          on_behalf_of: string | null
          pickup_date: string | null
          pickup_time: string | null
          source: Database["public"]["Enums"]["order_source"]
          status: Database["public"]["Enums"]["order_status"]
          unit_price: number | null
          updated_at: string
          weighed_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cleaning?: boolean
          cleaning_price?: number | null
          created_at?: string
          customer_id?: string | null
          cycle_id: string
          delivered_at?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          on_behalf_of?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          unit_price?: number | null
          updated_at?: string
          weighed_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cleaning?: boolean
          cleaning_price?: number | null
          created_at?: string
          customer_id?: string | null
          cycle_id?: string
          delivered_at?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          on_behalf_of?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          unit_price?: number | null
          updated_at?: string
          weighed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          created_at: string
          farm_id: string
          id: string
          note: string | null
          order_id: string
          paid_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          farm_id: string
          id?: string
          note?: string | null
          order_id: string
          paid_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          farm_id?: string
          id?: string
          note?: string | null
          order_id?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          available_weights: number[]
          cleaning_price: number
          default_cleaning: boolean
          farm_id: string
          id: string
          pickup_times: string[]
          raising_period_days: number
          sale_price: number
          updated_at: string
        }
        Insert: {
          available_weights?: number[]
          cleaning_price?: number
          default_cleaning?: boolean
          farm_id: string
          id?: string
          pickup_times?: string[]
          raising_period_days?: number
          sale_price?: number
          updated_at?: string
        }
        Update: {
          available_weights?: number[]
          cleaning_price?: number
          default_cleaning?: boolean
          farm_id?: string
          id?: string
          pickup_times?: string[]
          raising_period_days?: number
          sale_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farm"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_category: "feed" | "utilities" | "medicine" | "other"
      notification_audience: "customer" | "admin"
      order_source: "customer" | "admin"
      order_status: "pending" | "weighed" | "ready" | "delivered" | "cancelled"
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
      expense_category: ["feed", "utilities", "medicine", "other"],
      notification_audience: ["customer", "admin"],
      order_source: ["customer", "admin"],
      order_status: ["pending", "weighed", "ready", "delivered", "cancelled"],
    },
  },
} as const
