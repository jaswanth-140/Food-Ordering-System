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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          collection_name: string
          created_at: string
          id: string
          item_data: Json
          item_type: string
          user_id: string
        }
        Insert: {
          collection_name?: string
          created_at?: string
          id?: string
          item_data: Json
          item_type: string
          user_id: string
        }
        Update: {
          collection_name?: string
          created_at?: string
          id?: string
          item_data?: Json
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plan_slots: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_scheduled: boolean
          meal_data: Json | null
          meal_type: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_scheduled?: boolean
          meal_data?: Json | null
          meal_type: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_scheduled?: boolean
          meal_data?: Json | null
          meal_type?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: Json
          delivery_fee: number
          discount: number
          estimated_delivery: string | null
          id: string
          is_paid: boolean
          items: Json
          note: string | null
          order_number: string
          payment_method: string
          payment_status: string
          restaurant_data: Json
          status: string
          subtotal: number
          tax: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: Json
          delivery_fee?: number
          discount?: number
          estimated_delivery?: string | null
          id?: string
          is_paid?: boolean
          items: Json
          note?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          restaurant_data: Json
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: Json
          delivery_fee?: number
          discount?: number
          estimated_delivery?: string | null
          id?: string
          is_paid?: boolean
          items?: Json
          note?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          restaurant_data?: Json
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          loyalty_points: number
          name: string
          phone: string | null
          tier: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          loyalty_points?: number
          name?: string
          phone?: string | null
          tier?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          loyalty_points?: number
          name?: string
          phone?: string | null
          tier?: string
        }
        Relationships: []
      }
      saved_cards: {
        Row: {
          brand: string
          cardholder_name: string
          created_at: string
          expiry_month: string
          expiry_year: string
          id: string
          last4: string
          user_id: string
        }
        Insert: {
          brand: string
          cardholder_name: string
          created_at?: string
          expiry_month: string
          expiry_year: string
          id?: string
          last4: string
          user_id: string
        }
        Update: {
          brand?: string
          cardholder_name?: string
          created_at?: string
          expiry_month?: string
          expiry_year?: string
          id?: string
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_orders: {
        Row: {
          created_at: string
          frequency: string
          icon: string | null
          id: string
          is_active: boolean
          items_description: string | null
          name: string
          next_run_at: string | null
          price: number
          restaurant_name: string | null
          scheduled_days: number[] | null
          scheduled_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          items_description?: string | null
          name: string
          next_run_at?: string | null
          price?: number
          restaurant_name?: string | null
          scheduled_days?: number[] | null
          scheduled_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          items_description?: string | null
          name?: string
          next_run_at?: string | null
          price?: number
          restaurant_name?: string | null
          scheduled_days?: number[] | null
          scheduled_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
