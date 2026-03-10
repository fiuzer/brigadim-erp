export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "administrador" | "financeiro" | "vendas" | "estoque" | "visualizador";
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "administrador" | "financeiro" | "vendas" | "estoque" | "visualizador";
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          description: string | null;
          sku: string | null;
          production_cost: number;
          sale_price: number;
          stock_quantity: number;
          min_stock: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          description?: string | null;
          sku?: string | null;
          production_cost?: number;
          sale_price: number;
          stock_quantity?: number;
          min_stock?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          movement_type: "Entrada" | "Saída" | "Ajuste" | "Venda" | "Cancelamento";
          quantity: number;
          reason: string | null;
          notes: string | null;
          user_id: string | null;
          sale_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          movement_type: "Entrada" | "Saída" | "Ajuste" | "Venda" | "Cancelamento";
          quantity: number;
          reason?: string | null;
          notes?: string | null;
          user_id?: string | null;
          sale_item_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Insert"]>;
      };
      sales: {
        Row: {
          id: string;
          sold_at: string;
          discount_amount: number;
          subtotal_amount: number;
          total_amount: number;
          payment_method:
            | "Pix"
            | "Dinheiro"
            | "Cartão de Crédito"
            | "Cartão de Débito"
            | "Transferência"
            | "Outro";
          notes: string | null;
          status: "Ativa" | "Cancelada";
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sold_at?: string;
          discount_amount?: number;
          subtotal_amount: number;
          total_amount: number;
          payment_method:
            | "Pix"
            | "Dinheiro"
            | "Cartão de Crédito"
            | "Cartão de Débito"
            | "Transferência"
            | "Outro";
          notes?: string | null;
          status?: "Ativa" | "Cancelada";
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          production_cost: number;
          discount_amount: number;
          total_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          production_cost: number;
          discount_amount?: number;
          total_amount: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>;
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          expense_date: string;
          category_id: string | null;
          description: string;
          amount: number;
          notes: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          expense_date?: string;
          category_id?: string | null;
          description: string;
          amount: number;
          notes?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      dashboard_layouts: {
        Row: {
          user_id: string;
          layout: Json;
          default_filters: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          layout?: Json;
          default_filters?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dashboard_layouts"]["Insert"]>;
      };
      app_settings: {
        Row: {
          id: number;
          company_name: string;
          company_logo_url: string | null;
          default_currency: string;
          timezone: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          company_name?: string;
          company_logo_url?: string | null;
          default_currency?: string;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          table_name: string;
          action: string;
          record_id: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          table_name: string;
          action: string;
          record_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Views: {
      v_financial_summary: {
        Row: {
          period_date: string;
          revenue: number;
          cogs: number;
          gross_profit: number;
          expenses: number;
          net_profit: number;
          sales_count: number;
          average_ticket: number;
        };
      };
      v_low_stock_products: {
        Row: {
          product_id: string;
          product_name: string;
          stock_quantity: number;
          min_stock: number;
          category_name: string | null;
        };
      };
      v_product_performance: {
        Row: {
          product_id: string;
          product_name: string;
          total_quantity: number;
          revenue: number;
          cogs: number;
          gross_profit: number;
          gross_margin: number;
        };
      };
    };
    Functions: {
      cancel_sale: {
        Args: { sale_id_param: string };
        Returns: boolean;
      };
    };
  };
};
