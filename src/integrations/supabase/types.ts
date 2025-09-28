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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blockchain_transactions: {
        Row: {
          block_number: number | null
          created_at: string
          from_address: string
          gas_price: number | null
          gas_used: number | null
          id: string
          product_id: string | null
          status: string
          to_address: string | null
          transaction_data: Json | null
          transaction_hash: string
          transaction_type: string
          updated_at: string
          value_eth: number | null
        }
        Insert: {
          block_number?: number | null
          created_at?: string
          from_address: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          product_id?: string | null
          status?: string
          to_address?: string | null
          transaction_data?: Json | null
          transaction_hash: string
          transaction_type: string
          updated_at?: string
          value_eth?: number | null
        }
        Update: {
          block_number?: number | null
          created_at?: string
          from_address?: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          product_id?: string | null
          status?: string
          to_address?: string | null
          transaction_data?: Json | null
          transaction_hash?: string
          transaction_type?: string
          updated_at?: string
          value_eth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      distributor_inventory: {
        Row: {
          created_at: string
          description: string | null
          distributor_id: string
          expiry_date: string | null
          farmer_id: string
          farmer_name: string
          id: string
          original_product_id: string
          price_per_unit: number
          product_name: string
          quantity_available: number
          received_date: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          distributor_id: string
          expiry_date?: string | null
          farmer_id: string
          farmer_name: string
          id?: string
          original_product_id: string
          price_per_unit: number
          product_name: string
          quantity_available?: number
          received_date?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          distributor_id?: string
          expiry_date?: string | null
          farmer_id?: string
          farmer_name?: string
          id?: string
          original_product_id?: string
          price_per_unit?: number
          product_name?: string
          quantity_available?: number
          received_date?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributor_inventory_original_product_id_fkey"
            columns: ["original_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          blockchain_status: string | null
          blockchain_transaction_hash: string | null
          blockchain_transaction_id: string | null
          buyer_id: string
          id: string
          notes: string | null
          order_date: string
          order_type: string
          product_id: string | null
          quantity: number
          seller_id: string | null
          status: string
          supply_id: string | null
          total_price: number
        }
        Insert: {
          blockchain_status?: string | null
          blockchain_transaction_hash?: string | null
          blockchain_transaction_id?: string | null
          buyer_id: string
          id?: string
          notes?: string | null
          order_date?: string
          order_type: string
          product_id?: string | null
          quantity: number
          seller_id?: string | null
          status?: string
          supply_id?: string | null
          total_price: number
        }
        Update: {
          blockchain_status?: string | null
          blockchain_transaction_hash?: string | null
          blockchain_transaction_id?: string | null
          buyer_id?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_type?: string
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string
          supply_id?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          blockchain_id: string | null
          blockchain_transaction_hash: string | null
          created_at: string
          description: string | null
          farmer_id: string
          harvest_date: string | null
          id: string
          last_price_update: string | null
          name: string
          price_per_unit: number
          quantity_available: number
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          blockchain_id?: string | null
          blockchain_transaction_hash?: string | null
          created_at?: string
          description?: string | null
          farmer_id: string
          harvest_date?: string | null
          id?: string
          last_price_update?: string | null
          name: string
          price_per_unit: number
          quantity_available?: number
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          blockchain_id?: string | null
          blockchain_transaction_hash?: string | null
          created_at?: string
          description?: string | null
          farmer_id?: string
          harvest_date?: string | null
          id?: string
          last_price_update?: string | null
          name?: string
          price_per_unit?: number
          quantity_available?: number
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          blockchain_wallet: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          blockchain_wallet?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          blockchain_wallet?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplies: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          quantity_available: number
          supplier_name: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          quantity_available?: number
          supplier_name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          quantity_available?: number
          supplier_name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      supply_chain_tracking: {
        Row: {
          blockchain_hash: string | null
          created_at: string
          from_user_id: string
          id: string
          notes: string | null
          price_per_unit: number
          product_id: string
          quantity: number
          status: string
          to_user_id: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          blockchain_hash?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          notes?: string | null
          price_per_unit: number
          product_id: string
          quantity: number
          status?: string
          to_user_id: string
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          blockchain_hash?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          notes?: string | null
          price_per_unit?: number
          product_id?: string
          quantity?: number
          status?: string
          to_user_id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_chain_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_profile_field: {
        Args: { field_name: string; profile_user_id: string }
        Returns: boolean
      }
      get_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          role: string
          user_id: string
        }[]
      }
      get_public_profile_data: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          role: string
          user_id: string
        }[]
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
