export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          createdAt: string
          encryptedKey: string
          id: string
          isActive: boolean
          lastUsed: string | null
          name: string | null
          provider: Database["public"]["Enums"]["api_keys_provider_enum"]
          updatedAt: string
          userId: string | null
        }
        Insert: {
          createdAt?: string
          encryptedKey: string
          id?: string
          isActive?: boolean
          lastUsed?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["api_keys_provider_enum"]
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          createdAt?: string
          encryptedKey?: string
          id?: string
          isActive?: boolean
          lastUsed?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["api_keys_provider_enum"]
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_6c2e267ae764a9413b863a29342"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          createdAt: string | null
          description: string | null
          id: string
          metadata: Json | null
          operationType:
            | Database["public"]["Enums"]["point_transactions_operationtype_enum"]
            | null
          points: number
          stripePaymentId: string | null
          transactionType: Database["public"]["Enums"]["point_transactions_transactiontype_enum"]
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          operationType?:
            | Database["public"]["Enums"]["point_transactions_operationtype_enum"]
            | null
          points: number
          stripePaymentId?: string | null
          transactionType: Database["public"]["Enums"]["point_transactions_transactiontype_enum"]
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          operationType?:
            | Database["public"]["Enums"]["point_transactions_operationtype_enum"]
            | null
          points?: number
          stripePaymentId?: string | null
          transactionType?: Database["public"]["Enums"]["point_transactions_transactiontype_enum"]
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          createdAt: string | null
          description: string | null
          id: string
          monthlyPoints: number
          name: string
          price: number
          stripePriceId: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          id: string
          monthlyPoints: number
          name: string
          price: number
          stripePriceId: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          id?: string
          monthlyPoints?: number
          name?: string
          price?: number
          stripePriceId?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          canceledAt: string | null
          createdAt: string | null
          currentPeriodEnd: string
          currentPeriodStart: string
          id: string
          planName: string
          status: Database["public"]["Enums"]["subscriptions_status_enum"]
          stripePlanId: string
          stripeSubscriptionId: string
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          amount: number
          canceledAt?: string | null
          createdAt?: string | null
          currentPeriodEnd: string
          currentPeriodStart: string
          id?: string
          planName: string
          status?: Database["public"]["Enums"]["subscriptions_status_enum"]
          stripePlanId: string
          stripeSubscriptionId: string
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          amount?: number
          canceledAt?: string | null
          createdAt?: string | null
          currentPeriodEnd?: string
          currentPeriodStart?: string
          id?: string
          planName?: string
          status?: Database["public"]["Enums"]["subscriptions_status_enum"]
          stripePlanId?: string
          stripeSubscriptionId?: string
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          createdAt: string | null
          currentPeriodEnd: string
          id: string
          planId: string
          status: string
          stripeSubscriptionId: string | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string | null
          currentPeriodEnd: string
          id?: string
          planId: string
          status: string
          stripeSubscriptionId?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string | null
          currentPeriodEnd?: string
          id?: string
          planId?: string
          status?: string
          stripeSubscriptionId?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          createdAt: string
          displayName: string
          email: string
          googleId: string | null
          id: string
          password: string | null
          pointsBalance: number
          profilePicture: string | null
          stripeCustomerId: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          displayName: string
          email: string
          googleId?: string | null
          id?: string
          password?: string | null
          pointsBalance?: number
          profilePicture?: string | null
          stripeCustomerId?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          displayName?: string
          email?: string
          googleId?: string | null
          id?: string
          password?: string | null
          pointsBalance?: number
          profilePicture?: string | null
          stripeCustomerId?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_stripe_payment: {
        Args: {
          p_user_id: string
          p_points: number
          p_package_id: string
          p_payment_intent: string
          p_session_id: string
        }
        Returns: Json
      }
      record_point_usage: {
        Args: {
          p_user_id: string
          p_points: number
          p_operation_type: Database["public"]["Enums"]["point_transactions_operationtype_enum"]
          p_description?: string
          p_metadata?: Json
        }
        Returns: {
          new_balance: number
        }[]
      }
    }
    Enums: {
      api_keys_provider_enum: "openai" | "anthropic" | "google" | "other"
      point_transactions_operationtype_enum:
        | "SUBSCRIPTION_RENEWAL"
        | "API_USAGE"
        | "MANUAL_ADJUSTMENT"
        | "POINTS_PURCHASE"
        | "SUBSCRIPTION_REFUND"
      point_transactions_transactiontype_enum:
        | "CREDIT"
        | "DEBIT"
        | "PURCHASE"
        | "REFUND"
      subscription_plan_type: "small" | "medium" | "large"
      subscriptions_status_enum:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      api_keys_provider_enum: ["openai", "anthropic", "google", "other"],
      point_transactions_operationtype_enum: [
        "SUBSCRIPTION_RENEWAL",
        "API_USAGE",
        "MANUAL_ADJUSTMENT",
        "POINTS_PURCHASE",
        "SUBSCRIPTION_REFUND",
      ],
      point_transactions_transactiontype_enum: [
        "CREDIT",
        "DEBIT",
        "PURCHASE",
        "REFUND",
      ],
      subscription_plan_type: ["small", "medium", "large"],
      subscriptions_status_enum: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
