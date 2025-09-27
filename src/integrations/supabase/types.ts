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
      agent_events: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          kind: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          kind: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          kind?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          preferred_date: string | null
          preferred_time: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          available: boolean | null
          created_at: string | null
          date: string
          id: string
          technician_id: string | null
          time_slot: string
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          date: string
          id?: string
          technician_id?: string | null
          time_slot: string
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          technician_id?: string | null
          time_slot?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          analysis: Json | null
          call_id: string | null
          created_at: string | null
          duration: number | null
          id: number
          phone_number: string | null
          status: string | null
          summary: string | null
          tool_calls: Json | null
          transcript: string | null
        }
        Insert: {
          analysis?: Json | null
          call_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: number
          phone_number?: string | null
          status?: string | null
          summary?: string | null
          tool_calls?: Json | null
          transcript?: string | null
        }
        Update: {
          analysis?: Json | null
          call_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: number
          phone_number?: string | null
          status?: string | null
          summary?: string | null
          tool_calls?: Json | null
          transcript?: string | null
        }
        Relationships: []
      }
      call_transcripts: {
        Row: {
          call_id: string | null
          confidence: number | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          role: string
          timestamp: string | null
        }
        Insert: {
          call_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          role: string
          timestamp?: string | null
        }
        Update: {
          call_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          role?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "vapi_calls"
            referencedColumns: ["call_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          service_history: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          service_history?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service_history?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_type: string | null
          id: string
          message: string
          service: string
          severity: string | null
          stack_trace: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_type?: string | null
          id?: string
          message: string
          service: string
          severity?: string | null
          stack_trace?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_type?: string | null
          id?: string
          message?: string
          service?: string
          severity?: string | null
          stack_trace?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          created_by: string | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          order_index: number | null
          question: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          created_by?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          order_index?: number | null
          question: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          created_by?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          order_index?: number | null
          question?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          justification: string | null
          metadata: Json | null
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_data: string[] | null
          response: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          justification?: string | null
          metadata?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_data?: string[] | null
          response?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          justification?: string | null
          metadata?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_data?: string[] | null
          response?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interventions: {
        Row: {
          actual_price: number | null
          address: string
          assigned_technician: string | null
          city: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          completion_notes: string | null
          created_at: string
          customer_signature: string | null
          description: string | null
          equipment_needed: string[] | null
          estimated_duration: number | null
          estimated_price: number | null
          id: string
          invoice_sent_at: string | null
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          photos: string[] | null
          postal_code: string | null
          priority: string
          scheduled_date: string
          scheduled_time: string | null
          service_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_price?: number | null
          address: string
          assigned_technician?: string | null
          city?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          completion_notes?: string | null
          created_at?: string
          customer_signature?: string | null
          description?: string | null
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          estimated_price?: number | null
          id?: string
          invoice_sent_at?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          photos?: string[] | null
          postal_code?: string | null
          priority?: string
          scheduled_date: string
          scheduled_time?: string | null
          service_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_price?: number | null
          address?: string
          assigned_technician?: string | null
          city?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          completion_notes?: string | null
          created_at?: string
          customer_signature?: string | null
          description?: string | null
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          estimated_price?: number | null
          id?: string
          invoice_sent_at?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          photos?: string[] | null
          postal_code?: string | null
          priority?: string
          scheduled_date?: string
          scheduled_time?: string | null
          service_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          adresse: string | null
          assigned_to: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          nom: string
          notes: string | null
          priorite: string | null
          service: string | null
          source: string | null
          status: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          nom: string
          notes?: string | null
          priorite?: string | null
          service?: string | null
          source?: string | null
          status?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          nom?: string
          notes?: string | null
          priorite?: string | null
          service?: string | null
          source?: string | null
          status?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      planning: {
        Row: {
          break_type: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          intervention_id: string | null
          is_available: boolean | null
          notes: string | null
          start_time: string
          technician_id: string
          technician_name: string
          updated_at: string
        }
        Insert: {
          break_type?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          intervention_id?: string | null
          is_available?: boolean | null
          notes?: string | null
          start_time: string
          technician_id: string
          technician_name: string
          updated_at?: string
        }
        Update: {
          break_type?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          intervention_id?: string | null
          is_available?: boolean | null
          notes?: string | null
          start_time?: string
          technician_id?: string
          technician_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          base_price: number
          created_at: string | null
          id: number
          is_active: boolean | null
          max_price: number
          min_price: number
          service_type: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          max_price: number
          min_price: number
          service_type: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          max_price?: number
          min_price?: number
          service_type?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_validations: {
        Row: {
          active: boolean | null
          conditions: Json | null
          created_at: string | null
          discount_percentage: number | null
          id: number
          max_amount: number | null
          min_amount: number | null
          rule_name: string
          rule_type: string
          surcharge_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: number
          max_amount?: number | null
          min_amount?: number | null
          rule_name: string
          rule_type: string
          surcharge_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: number
          max_amount?: number | null
          min_amount?: number | null
          rule_name?: string
          rule_type?: string
          surcharge_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      priorities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          response_time_hours: number
          sms_alert: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          response_time_hours: number
          sms_alert?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          response_time_hours?: number
          sms_alert?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          metadata: Json | null
          requests: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          metadata?: Json | null
          requests?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          metadata?: Json | null
          requests?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          city: string | null
          created_at: string | null
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          estimated_price: number | null
          id: number
          priority: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_price?: number | null
          id?: number
          priority?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_price?: number | null
          id?: number
          priority?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_restrictions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: number
          keywords: string[] | null
          rejection_message: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          keywords?: string[] | null
          rejection_message: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          keywords?: string[] | null
          rejection_message?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          message: string
          priority: string
          recipients: Json
          sent_at: string
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          message: string
          priority: string
          recipients?: Json
          sent_at?: string
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string
          priority?: string
          recipients?: Json
          sent_at?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          closed_at: string | null
          created_at: string
          description: string
          feedback: string | null
          id: string
          metadata: Json | null
          priority: string
          resolution: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          closed_at?: string | null
          created_at?: string
          description: string
          feedback?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string
          feedback?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      system_constraints: {
        Row: {
          action: string
          category: string
          condition: string
          constraint_id: string
          created_at: string | null
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          action: string
          category: string
          condition: string
          constraint_id: string
          created_at?: string | null
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          category?: string
          condition?: string
          constraint_id?: string
          created_at?: string | null
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_calls: {
        Row: {
          arguments: Json | null
          call_id: string | null
          created_at: string | null
          id: string
          result: Json | null
          status: string | null
          timestamp: string | null
          tool_name: string
        }
        Insert: {
          arguments?: Json | null
          call_id?: string | null
          created_at?: string | null
          id?: string
          result?: Json | null
          status?: string | null
          timestamp?: string | null
          tool_name: string
        }
        Update: {
          arguments?: Json | null
          call_id?: string | null
          created_at?: string | null
          id?: string
          result?: Json | null
          status?: string | null
          timestamp?: string | null
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_calls_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "vapi_calls"
            referencedColumns: ["call_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          permissions: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vapi_calls: {
        Row: {
          call_id: string
          created_at: string | null
          customer_name: string | null
          duration: number | null
          ended_at: string | null
          id: string
          metadata: Json | null
          phone_number: string | null
          priority: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          call_id: string
          created_at?: string | null
          customer_name?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          phone_number?: string | null
          priority?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          call_id?: string
          created_at?: string | null
          customer_name?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          phone_number?: string | null
          priority?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_dashboard_metrics_optimized: {
        Args: { time_period?: string }
        Returns: Json
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "technician" | "agent" | "client"
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
      app_role: ["admin", "manager", "technician", "agent", "client"],
    },
  },
} as const
