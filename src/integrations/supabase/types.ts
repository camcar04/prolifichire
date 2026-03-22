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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          channels: string[]
          conditions: Json
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          rule_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: string[]
          conditions?: Json
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: string[]
          conditions?: Json
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      communication_preferences: {
        Row: {
          alternate_phone: string | null
          id: string
          notify_approvals: boolean | null
          notify_contracts: boolean | null
          notify_delays: boolean | null
          notify_invoices: boolean | null
          notify_packets: boolean | null
          notify_payouts: boolean | null
          notify_quotes: boolean | null
          notify_scheduling: boolean | null
          preferred_method: Database["public"]["Enums"]["comm_method"]
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alternate_phone?: string | null
          id?: string
          notify_approvals?: boolean | null
          notify_contracts?: boolean | null
          notify_delays?: boolean | null
          notify_invoices?: boolean | null
          notify_packets?: boolean | null
          notify_payouts?: boolean | null
          notify_quotes?: boolean | null
          notify_scheduling?: boolean | null
          preferred_method?: Database["public"]["Enums"]["comm_method"]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alternate_phone?: string | null
          id?: string
          notify_approvals?: boolean | null
          notify_contracts?: boolean | null
          notify_delays?: boolean | null
          notify_invoices?: boolean | null
          notify_packets?: boolean | null
          notify_payouts?: boolean | null
          notify_quotes?: boolean | null
          notify_scheduling?: boolean | null
          preferred_method?: Database["public"]["Enums"]["comm_method"]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          ip_address: unknown
          reminder_sent_at: string | null
          signed_at: string | null
          signer_id: string
          signer_name: string
          signer_role: string
          status: Database["public"]["Enums"]["signature_status"]
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          reminder_sent_at?: string | null
          signed_at?: string | null
          signer_id: string
          signer_name: string
          signer_role: string
          status?: Database["public"]["Enums"]["signature_status"]
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          reminder_sent_at?: string | null
          signed_at?: string | null
          signer_id?: string
          signer_name?: string
          signer_role?: string
          status?: Database["public"]["Enums"]["signature_status"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          content_html: string | null
          content_json: Json | null
          created_at: string
          created_by: string
          expires_at: string | null
          fields_included: string[] | null
          fully_signed_at: string | null
          id: string
          job_id: string
          status: Database["public"]["Enums"]["contract_status"]
          terms: Json | null
          title: string
          type: Database["public"]["Enums"]["contract_type"]
        }
        Insert: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          fields_included?: string[] | null
          fully_signed_at?: string | null
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["contract_status"]
          terms?: Json | null
          title: string
          type: Database["public"]["Enums"]["contract_type"]
        }
        Update: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          fields_included?: string[] | null
          fully_signed_at?: string | null
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          terms?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["contract_type"]
        }
        Relationships: [
          {
            foreignKeyName: "contracts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          created_at: string
          expires_at: string | null
          file_path: string | null
          id: string
          is_verified: boolean | null
          issued_at: string | null
          issuer: string
          name: string
          number: string | null
          operator_id: string
          status: string
          type: Database["public"]["Enums"]["credential_type"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          is_verified?: boolean | null
          issued_at?: string | null
          issuer: string
          name: string
          number?: string | null
          operator_id: string
          status?: string
          type: Database["public"]["Enums"]["credential_type"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          is_verified?: boolean | null
          issued_at?: string | null
          issuer?: string
          name?: string
          number?: string | null
          operator_id?: string
          status?: string
          type?: Database["public"]["Enums"]["credential_type"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credentials_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_assets: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          created_at: string
          crop_year: number | null
          description: string | null
          field_id: string
          file_name: string
          file_size: number
          format: Database["public"]["Enums"]["file_format"]
          id: string
          is_latest: boolean | null
          job_id: string | null
          metadata: Json | null
          mime_type: string | null
          operation_type: Database["public"]["Enums"]["operation_type"] | null
          storage_path: string
          uploaded_by: string
          version: number
        }
        Insert: {
          category: Database["public"]["Enums"]["file_category"]
          created_at?: string
          crop_year?: number | null
          description?: string | null
          field_id: string
          file_name: string
          file_size?: number
          format?: Database["public"]["Enums"]["file_format"]
          id?: string
          is_latest?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"] | null
          storage_path: string
          uploaded_by: string
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          created_at?: string
          crop_year?: number | null
          description?: string | null
          field_id?: string
          file_name?: string
          file_size?: number
          format?: Database["public"]["Enums"]["file_format"]
          id?: string
          is_latest?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"] | null
          storage_path?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dataset_assets_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          against_id: string
          amount_disputed: number | null
          created_at: string
          description: string | null
          display_id: string
          field_id: string
          id: string
          job_id: string
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          against_id: string
          amount_disputed?: number | null
          created_at?: string
          description?: string | null
          display_id?: string
          field_id: string
          id?: string
          job_id: string
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          against_id?: string
          amount_disputed?: number | null
          created_at?: string
          description?: string | null
          display_id?: string
          field_id?: string
          id?: string
          job_id?: string
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          boom_width_ft: number | null
          capacity: string | null
          created_at: string
          gps_equipped: boolean | null
          hauling_capacity_tons: number | null
          hopper_capacity_bu: number | null
          id: string
          iso_compatible: boolean | null
          make: string
          model: string
          notes: string | null
          operator_id: string
          precision_compatible: string[] | null
          row_count: number | null
          row_spacing: number | null
          see_and_spray: boolean | null
          serial_number: string | null
          status: string
          tank_size_gal: number | null
          type: string
          unit_name: string | null
          variable_rate: boolean | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          width_ft: number | null
          year: number | null
        }
        Insert: {
          boom_width_ft?: number | null
          capacity?: string | null
          created_at?: string
          gps_equipped?: boolean | null
          hauling_capacity_tons?: number | null
          hopper_capacity_bu?: number | null
          id?: string
          iso_compatible?: boolean | null
          make: string
          model: string
          notes?: string | null
          operator_id: string
          precision_compatible?: string[] | null
          row_count?: number | null
          row_spacing?: number | null
          see_and_spray?: boolean | null
          serial_number?: string | null
          status?: string
          tank_size_gal?: number | null
          type: string
          unit_name?: string | null
          variable_rate?: boolean | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          width_ft?: number | null
          year?: number | null
        }
        Update: {
          boom_width_ft?: number | null
          capacity?: string | null
          created_at?: string
          gps_equipped?: boolean | null
          hauling_capacity_tons?: number | null
          hopper_capacity_bu?: number | null
          id?: string
          iso_compatible?: boolean | null
          make?: string
          model?: string
          notes?: string | null
          operator_id?: string
          precision_compatible?: string[] | null
          row_count?: number | null
          row_spacing?: number | null
          see_and_spray?: boolean | null
          serial_number?: string | null
          status?: string
          tank_size_gal?: number | null
          type?: string
          unit_name?: string | null
          variable_rate?: boolean | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          width_ft?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_documents: {
        Row: {
          equipment_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          notes: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          equipment_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          equipment_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      external_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          display_name: string
          id: string
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          provider_account_id: string | null
          refresh_token_encrypted: string | null
          scopes: string[] | null
          status: string
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          provider_account_id?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          status?: string
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_account_id?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          status?: string
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farms: {
        Row: {
          county: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          owner_id: string
          state: string | null
          tenant_id: string | null
          total_acres: number | null
          updated_at: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          owner_id: string
          state?: string | null
          tenant_id?: string | null
          total_acres?: number | null
          updated_at?: string
        }
        Update: {
          county?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          state?: string | null
          tenant_id?: string | null
          total_acres?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      field_access_instructions: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          directions: string
          field_id: string
          gate_code: string | null
          hazards: string | null
          id: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          directions: string
          field_id: string
          gate_code?: string | null
          hazards?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          directions?: string
          field_id?: string
          gate_code?: string | null
          hazards?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_access_instructions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: true
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      field_packet_files: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          dataset_id: string | null
          file_name: string | null
          file_size: number | null
          format: Database["public"]["Enums"]["file_format"]
          id: string
          included: boolean | null
          packet_id: string
          required: boolean | null
          version: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["file_category"]
          dataset_id?: string | null
          file_name?: string | null
          file_size?: number | null
          format?: Database["public"]["Enums"]["file_format"]
          id?: string
          included?: boolean | null
          packet_id: string
          required?: boolean | null
          version?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          dataset_id?: string | null
          file_name?: string | null
          file_size?: number | null
          format?: Database["public"]["Enums"]["file_format"]
          id?: string
          included?: boolean | null
          packet_id?: string
          required?: boolean | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "field_packet_files_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "dataset_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_packet_files_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "field_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      field_packets: {
        Row: {
          approved_at: string | null
          approved_for_execution: boolean | null
          created_at: string
          download_count: number | null
          field_id: string
          generated_at: string | null
          id: string
          job_id: string
          last_download_at: string | null
          last_download_by: string | null
          missing_required: string[] | null
          operator_id: string | null
          status: Database["public"]["Enums"]["packet_status"]
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_for_execution?: boolean | null
          created_at?: string
          download_count?: number | null
          field_id: string
          generated_at?: string | null
          id?: string
          job_id: string
          last_download_at?: string | null
          last_download_by?: string | null
          missing_required?: string[] | null
          operator_id?: string | null
          status?: Database["public"]["Enums"]["packet_status"]
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_for_execution?: boolean | null
          created_at?: string
          download_count?: number | null
          field_id?: string
          generated_at?: string | null
          id?: string
          job_id?: string
          last_download_at?: string | null
          last_download_by?: string | null
          missing_required?: string[] | null
          operator_id?: string | null
          status?: Database["public"]["Enums"]["packet_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "field_packets_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_packets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      field_requirements: {
        Row: {
          applies_to: Database["public"]["Enums"]["operation_type"][] | null
          created_at: string
          created_by: string | null
          description: string
          field_id: string
          id: string
          severity: string
          type: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["operation_type"][] | null
          created_at?: string
          created_by?: string | null
          description: string
          field_id: string
          id?: string
          severity: string
          type: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["operation_type"][] | null
          created_at?: string
          created_by?: string | null
          description?: string
          field_id?: string
          id?: string
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_requirements_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          acreage: number
          bbox_east: number | null
          bbox_north: number | null
          bbox_south: number | null
          bbox_west: number | null
          boundary_geojson: Json | null
          centroid_lat: number | null
          centroid_lng: number | null
          clu_number: string | null
          county: string | null
          created_at: string
          crop: Database["public"]["Enums"]["crop_type"]
          crop_year: number
          farm_id: string
          fsa_farm_number: string | null
          id: string
          legal_description: string | null
          name: string
          state: string | null
          status: Database["public"]["Enums"]["field_status"]
          updated_at: string
        }
        Insert: {
          acreage?: number
          bbox_east?: number | null
          bbox_north?: number | null
          bbox_south?: number | null
          bbox_west?: number | null
          boundary_geojson?: Json | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          clu_number?: string | null
          county?: string | null
          created_at?: string
          crop?: Database["public"]["Enums"]["crop_type"]
          crop_year?: number
          farm_id: string
          fsa_farm_number?: string | null
          id?: string
          legal_description?: string | null
          name: string
          state?: string | null
          status?: Database["public"]["Enums"]["field_status"]
          updated_at?: string
        }
        Update: {
          acreage?: number
          bbox_east?: number | null
          bbox_north?: number | null
          bbox_south?: number | null
          bbox_west?: number | null
          boundary_geojson?: Json | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          clu_number?: string | null
          county?: string | null
          created_at?: string
          crop?: Database["public"]["Enums"]["crop_type"]
          crop_year?: number
          farm_id?: string
          fsa_farm_number?: string | null
          id?: string
          legal_description?: string | null
          name?: string
          state?: string | null
          status?: Database["public"]["Enums"]["field_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      hauling_assignments: {
        Row: {
          assigned_at: string
          completed_at: string | null
          id: string
          job_id: string
          loads_completed: number | null
          notes: string | null
          operator_id: string
          started_at: string | null
          status: string
          truck_id: string | null
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          id?: string
          job_id: string
          loads_completed?: number | null
          notes?: string | null
          operator_id: string
          started_at?: string | null
          status?: string
          truck_id?: string | null
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          id?: string
          job_id?: string
          loads_completed?: number | null
          notes?: string | null
          operator_id?: string
          started_at?: string | null
          status?: string
          truck_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hauling_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hauling_assignments_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "truck_units"
            referencedColumns: ["id"]
          },
        ]
      }
      hauling_job_details: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_location_name: string | null
          estimated_cycle_minutes: number | null
          estimated_distance_miles: number | null
          expected_loads_per_day: number | null
          harvest_conditions: string | null
          id: string
          job_id: string
          moisture_notes: string | null
          scale_ticket_required: boolean | null
          schedule_model: string
          trucks_assigned: number
          trucks_needed: number
          unload_instructions: string | null
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_location_name?: string | null
          estimated_cycle_minutes?: number | null
          estimated_distance_miles?: number | null
          expected_loads_per_day?: number | null
          harvest_conditions?: string | null
          id?: string
          job_id: string
          moisture_notes?: string | null
          scale_ticket_required?: boolean | null
          schedule_model?: string
          trucks_assigned?: number
          trucks_needed?: number
          unload_instructions?: string | null
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_location_name?: string | null
          estimated_cycle_minutes?: number | null
          estimated_distance_miles?: number | null
          expected_loads_per_day?: number | null
          harvest_conditions?: string | null
          id?: string
          job_id?: string
          moisture_notes?: string | null
          scale_ticket_required?: boolean | null
          schedule_model?: string
          trucks_assigned?: number
          trucks_needed?: number
          unload_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hauling_job_details_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_operators: {
        Row: {
          id: string
          invited_at: string
          job_id: string
          operator_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          id?: string
          invited_at?: string
          job_id: string
          operator_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          id?: string
          invited_at?: string
          job_id?: string
          operator_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invited_operators_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          quantity: number
          total: number
          unit: string
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          display_id: string
          due_date: string
          fees: number | null
          field_id: string
          id: string
          issued_by: string
          issued_to: string
          job_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          subtotal: number
          tax: number | null
          total: number
        }
        Insert: {
          created_at?: string
          display_id?: string
          due_date: string
          fees?: number | null
          field_id: string
          id?: string
          issued_by: string
          issued_to: string
          job_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Update: {
          created_at?: string
          display_id?: string
          due_date?: string
          fees?: number | null
          field_id?: string
          id?: string
          issued_by?: string
          issued_to?: string
          job_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_exceptions: {
        Row: {
          created_at: string
          description: string
          id: string
          job_id: string
          raised_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          type: Database["public"]["Enums"]["exception_type"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          job_id: string
          raised_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type: Database["public"]["Enums"]["exception_type"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          job_id?: string
          raised_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type?: Database["public"]["Enums"]["exception_type"]
        }
        Relationships: [
          {
            foreignKeyName: "job_exceptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_fields: {
        Row: {
          acreage: number
          crop: Database["public"]["Enums"]["crop_type"]
          field_id: string
          id: string
          job_id: string
          sequence: number
          status: string
        }
        Insert: {
          acreage: number
          crop?: Database["public"]["Enums"]["crop_type"]
          field_id: string
          id?: string
          job_id: string
          sequence?: number
          status?: string
        }
        Update: {
          acreage?: number
          crop?: Database["public"]["Enums"]["crop_type"]
          field_id?: string
          id?: string
          job_id?: string
          sequence?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_fields_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_inputs: {
        Row: {
          brand: string | null
          created_at: string
          estimated_pickup_distance: number | null
          estimated_pickup_time: number | null
          handling_notes: string | null
          id: string
          job_id: string
          pickup_address: string | null
          pickup_city: string | null
          pickup_contact: string | null
          pickup_instructions: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_name: string | null
          pickup_phone: string | null
          pickup_required: boolean
          pickup_state: string | null
          pickup_zip: string | null
          product_name: string
          product_type: string
          quantity: number | null
          safety_notes: string | null
          sequence: number
          supplied_by: string
          unit: string | null
          updated_at: string
          variant: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          estimated_pickup_distance?: number | null
          estimated_pickup_time?: number | null
          handling_notes?: string | null
          id?: string
          job_id: string
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_contact?: string | null
          pickup_instructions?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location_name?: string | null
          pickup_phone?: string | null
          pickup_required?: boolean
          pickup_state?: string | null
          pickup_zip?: string | null
          product_name: string
          product_type?: string
          quantity?: number | null
          safety_notes?: string | null
          sequence?: number
          supplied_by?: string
          unit?: string | null
          updated_at?: string
          variant?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          estimated_pickup_distance?: number | null
          estimated_pickup_time?: number | null
          handling_notes?: string | null
          id?: string
          job_id?: string
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_contact?: string | null
          pickup_instructions?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location_name?: string | null
          pickup_phone?: string | null
          pickup_required?: boolean
          pickup_state?: string | null
          pickup_zip?: string | null
          product_name?: string
          product_type?: string
          quantity?: number | null
          safety_notes?: string | null
          sequence?: number
          supplied_by?: string
          unit?: string | null
          updated_at?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_inputs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_templates: {
        Row: {
          base_rate: number | null
          comm_defaults: Json | null
          contract_defaults: Json | null
          created_at: string
          crop: Database["public"]["Enums"]["crop_type"] | null
          description: string | null
          id: string
          is_shared: boolean | null
          name: string
          notes: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          owner_id: string
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          required_files: string[] | null
          requirements: string | null
          spec_data: Json
          updated_at: string
          urgency: string | null
          use_count: number | null
        }
        Insert: {
          base_rate?: number | null
          comm_defaults?: Json | null
          contract_defaults?: Json | null
          created_at?: string
          crop?: Database["public"]["Enums"]["crop_type"] | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          notes?: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          owner_id: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          required_files?: string[] | null
          requirements?: string | null
          spec_data?: Json
          updated_at?: string
          urgency?: string | null
          use_count?: number | null
        }
        Update: {
          base_rate?: number | null
          comm_defaults?: Json | null
          contract_defaults?: Json | null
          created_at?: string
          crop?: Database["public"]["Enums"]["crop_type"] | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          notes?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"]
          owner_id?: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          required_files?: string[] | null
          requirements?: string | null
          spec_data?: Json
          updated_at?: string
          urgency?: string | null
          use_count?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          approved_total: number | null
          base_rate: number
          change_order_count: number | null
          contract_mode: string
          created_at: string
          deadline: string
          description: string | null
          display_id: string
          estimated_total: number
          exception_count: number | null
          farm_id: string
          id: string
          invoiced_total: number | null
          notes: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          operator_id: string | null
          paid_total: number | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          proof_approved: boolean | null
          proof_submitted: boolean | null
          requested_by: string
          requirements: string | null
          response_deadline: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          split_payment: boolean | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          total_acres: number
          travel_distance: number | null
          travel_eta: number | null
          updated_at: string
          urgency: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          approved_total?: number | null
          base_rate?: number
          change_order_count?: number | null
          contract_mode?: string
          created_at?: string
          deadline: string
          description?: string | null
          display_id?: string
          estimated_total?: number
          exception_count?: number | null
          farm_id: string
          id?: string
          invoiced_total?: number | null
          notes?: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          operator_id?: string | null
          paid_total?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          proof_approved?: boolean | null
          proof_submitted?: boolean | null
          requested_by: string
          requirements?: string | null
          response_deadline?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          split_payment?: boolean | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          total_acres?: number
          travel_distance?: number | null
          travel_eta?: number | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          approved_total?: number | null
          base_rate?: number
          change_order_count?: number | null
          contract_mode?: string
          created_at?: string
          deadline?: string
          description?: string | null
          display_id?: string
          estimated_total?: number
          exception_count?: number | null
          farm_id?: string
          id?: string
          invoiced_total?: number | null
          notes?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"]
          operator_id?: string | null
          paid_total?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          proof_approved?: boolean | null
          proof_submitted?: boolean | null
          requested_by?: string
          requirements?: string | null
          response_deadline?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          split_payment?: boolean | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          total_acres?: number
          travel_distance?: number | null
          travel_eta?: number | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          label: string
          lat: number | null
          lng: number | null
          notes: string | null
          organization_id: string
          state: string | null
          type: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          organization_id: string
          state?: string | null
          type?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          organization_id?: string
          state?: string | null
          type?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          field_id: string | null
          id: string
          job_id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          field_id?: string | null
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          field_id?: string | null
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_ids: string[] | null
          content: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachment_ids?: string[] | null
          content: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          attachment_ids?: string[] | null
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      network_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          member_type: string
          network_id: string
          status: Database["public"]["Enums"]["network_member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          member_type?: string
          network_id: string
          status?: Database["public"]["Enums"]["network_member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          member_type?: string
          network_id?: string
          status?: Database["public"]["Enums"]["network_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_members_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      network_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          network_id: string
          rule_data: Json
          rule_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          network_id: string
          rule_data?: Json
          rule_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          network_id?: string
          rule_data?: Json
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_rules_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      networks: {
        Row: {
          allowed_operation_types: string[] | null
          created_at: string
          description: string | null
          id: string
          max_members: number | null
          name: string
          network_type: Database["public"]["Enums"]["network_type"]
          organization_id: string
          pricing_visible: boolean | null
          require_grower_approval: boolean | null
          require_operator_approval: boolean | null
          required_credentials: string[] | null
          updated_at: string
          visibility: Database["public"]["Enums"]["network_visibility"]
        }
        Insert: {
          allowed_operation_types?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          max_members?: number | null
          name: string
          network_type?: Database["public"]["Enums"]["network_type"]
          organization_id: string
          pricing_visible?: boolean | null
          require_grower_approval?: boolean | null
          require_operator_approval?: boolean | null
          required_credentials?: string[] | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["network_visibility"]
        }
        Update: {
          allowed_operation_types?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          max_members?: number | null
          name?: string
          network_type?: Database["public"]["Enums"]["network_type"]
          organization_id?: string
          pricing_visible?: boolean | null
          require_grower_approval?: boolean | null
          require_operator_approval?: boolean | null
          required_credentials?: string[] | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["network_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "networks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      operation_specs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          spec_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          spec_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          operation_type?: Database["public"]["Enums"]["operation_type"]
          spec_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_specs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_capabilities: {
        Row: {
          created_at: string
          equipment_capabilities: string[]
          id: string
          max_job_acres: number | null
          min_job_acres: number | null
          operator_profile_id: string
          preferred_job_types: string[]
          sub_capabilities: string[]
          supported_crops: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_capabilities?: string[]
          id?: string
          max_job_acres?: number | null
          min_job_acres?: number | null
          operator_profile_id: string
          preferred_job_types?: string[]
          sub_capabilities?: string[]
          supported_crops?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_capabilities?: string[]
          id?: string
          max_job_acres?: number | null
          min_job_acres?: number | null
          operator_profile_id?: string
          preferred_job_types?: string[]
          sub_capabilities?: string[]
          supported_crops?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_capabilities_operator_profile_id_fkey"
            columns: ["operator_profile_id"]
            isOneToOne: true
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_profiles: {
        Row: {
          base_address: string | null
          base_lat: number | null
          base_lng: number | null
          bio: string | null
          business_name: string
          completed_jobs: number | null
          contract_signer_email: string | null
          contract_signer_name: string | null
          created_at: string
          crew_count: number | null
          id: string
          insurance_verified: boolean | null
          is_verified: boolean | null
          machine_compatibility: string[] | null
          max_drive_time: number | null
          max_travel_distance: number | null
          min_acres_for_distant: number | null
          onboarding_completed: boolean | null
          organization_id: string
          rating: number | null
          review_count: number | null
          routing_preference: string | null
          service_radius: number | null
          service_types: Database["public"]["Enums"]["operation_type"][]
          stripe_account_id: string | null
          stripe_onboarded: boolean | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          base_address?: string | null
          base_lat?: number | null
          base_lng?: number | null
          bio?: string | null
          business_name: string
          completed_jobs?: number | null
          contract_signer_email?: string | null
          contract_signer_name?: string | null
          created_at?: string
          crew_count?: number | null
          id?: string
          insurance_verified?: boolean | null
          is_verified?: boolean | null
          machine_compatibility?: string[] | null
          max_drive_time?: number | null
          max_travel_distance?: number | null
          min_acres_for_distant?: number | null
          onboarding_completed?: boolean | null
          organization_id: string
          rating?: number | null
          review_count?: number | null
          routing_preference?: string | null
          service_radius?: number | null
          service_types?: Database["public"]["Enums"]["operation_type"][]
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          base_address?: string | null
          base_lat?: number | null
          base_lng?: number | null
          bio?: string | null
          business_name?: string
          completed_jobs?: number | null
          contract_signer_email?: string | null
          contract_signer_name?: string | null
          created_at?: string
          crew_count?: number | null
          id?: string
          insurance_verified?: boolean | null
          is_verified?: boolean | null
          machine_compatibility?: string[] | null
          max_drive_time?: number | null
          max_travel_distance?: number | null
          min_acres_for_distant?: number | null
          onboarding_completed?: boolean | null
          organization_id?: string
          rating?: number | null
          review_count?: number | null
          routing_preference?: string | null
          service_radius?: number | null
          service_types?: Database["public"]["Enums"]["operation_type"][]
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_role: string
          organization_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_role?: string
          organization_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_role?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          org_role: string
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_role?: string
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_role?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          state: string | null
          type: string
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          type: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          type?: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string | null
          payer_id: string
          processed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string | null
          payer_id: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string | null
          payer_id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          completed_at: string | null
          created_at: string
          estimated_arrival: string | null
          gross_amount: number
          id: string
          invoice_id: string
          job_id: string
          net_amount: number
          operator_id: string
          platform_fee: number | null
          processing_fee: number | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_transfer_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          estimated_arrival?: string | null
          gross_amount: number
          id?: string
          invoice_id: string
          job_id: string
          net_amount: number
          operator_id: string
          platform_fee?: number | null
          processing_fee?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_transfer_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          estimated_arrival?: string | null
          gross_amount?: number
          id?: string
          invoice_id?: string
          job_id?: string
          net_amount?: number
          operator_id?: string
          platform_fee?: number | null
          processing_fee?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_grants: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          expires_at: string | null
          granted_by: string
          id: string
          level: Database["public"]["Enums"]["permission_level"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          expires_at?: string | null
          granted_by: string
          id?: string
          level: Database["public"]["Enums"]["permission_level"]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          level?: Database["public"]["Enums"]["permission_level"]
          user_id?: string
        }
        Relationships: []
      }
      pricing_estimates: {
        Row: {
          acreage: number
          base_rate: number
          clustering_discount: number | null
          created_at: string
          field_id: string | null
          fill_likelihood: string | null
          high_estimate: number
          id: string
          job_id: string | null
          low_estimate: number
          operation_type: Database["public"]["Enums"]["operation_type"]
          price_drivers: Json
          recommended_estimate: number
          travel_cost: number | null
          travel_distance: number | null
          urgency: string
          urgency_adjustment: number | null
        }
        Insert: {
          acreage?: number
          base_rate?: number
          clustering_discount?: number | null
          created_at?: string
          field_id?: string | null
          fill_likelihood?: string | null
          high_estimate?: number
          id?: string
          job_id?: string | null
          low_estimate?: number
          operation_type: Database["public"]["Enums"]["operation_type"]
          price_drivers?: Json
          recommended_estimate?: number
          travel_cost?: number | null
          travel_distance?: number | null
          urgency?: string
          urgency_adjustment?: number | null
        }
        Update: {
          acreage?: number
          base_rate?: number
          clustering_discount?: number | null
          created_at?: string
          field_id?: string | null
          fill_likelihood?: string | null
          high_estimate?: number
          id?: string
          job_id?: string | null
          low_estimate?: number
          operation_type?: Database["public"]["Enums"]["operation_type"]
          price_drivers?: Json
          recommended_estimate?: number
          travel_cost?: number | null
          travel_distance?: number | null
          urgency?: string
          urgency_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_estimates_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_estimates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_contact_email: string | null
          approval_contact_name: string | null
          avatar_url: string | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          onboarding_completed: boolean | null
          organization_id: string | null
          phone: string | null
          preferred_comm_method:
            | Database["public"]["Enums"]["comm_method"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_contact_email?: string | null
          approval_contact_name?: string | null
          avatar_url?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          created_at?: string
          email: string
          first_name?: string
          id?: string
          last_name?: string
          onboarding_completed?: boolean | null
          organization_id?: string | null
          phone?: string | null
          preferred_comm_method?:
            | Database["public"]["Enums"]["comm_method"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_contact_email?: string | null
          approval_contact_name?: string | null
          avatar_url?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          onboarding_completed?: boolean | null
          organization_id?: string | null
          phone?: string | null
          preferred_comm_method?:
            | Database["public"]["Enums"]["comm_method"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          base_rate: number
          id: string
          job_id: string
          material_cost: number | null
          notes: string | null
          operator_id: string
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          status: Database["public"]["Enums"]["quote_status"]
          submitted_at: string
          total_quote: number
          travel_fee: number | null
          valid_until: string | null
        }
        Insert: {
          base_rate: number
          id?: string
          job_id: string
          material_cost?: number | null
          notes?: string | null
          operator_id: string
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          status?: Database["public"]["Enums"]["quote_status"]
          submitted_at?: string
          total_quote: number
          travel_fee?: number | null
          valid_until?: string | null
        }
        Update: {
          base_rate?: number
          id?: string
          job_id?: string
          material_cost?: number | null
          notes?: string | null
          operator_id?: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          status?: Database["public"]["Enums"]["quote_status"]
          submitted_at?: string
          total_quote?: number
          travel_fee?: number | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          county: string | null
          created_at: string
          id: string
          operator_profile_id: string
          state: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          id?: string
          operator_profile_id: string
          state: string
        }
        Update: {
          county?: string | null
          created_at?: string
          id?: string
          operator_profile_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_operator_profile_id_fkey"
            columns: ["operator_profile_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      split_rules: {
        Row: {
          fixed_amount: number | null
          id: string
          job_id: string
          payer_id: string
          payer_name: string
          payer_role: string
          percentage: number
          status: string
        }
        Insert: {
          fixed_amount?: number | null
          id?: string
          job_id: string
          payer_id: string
          payer_name: string
          payer_role: string
          percentage: number
          status?: string
        }
        Update: {
          fixed_amount?: number | null
          id?: string
          job_id?: string
          payer_id?: string
          payer_name?: string
          payer_role?: string
          percentage?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_rules_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string
          created_at: string
          direction: string
          entity_count: number | null
          entity_type: string
          error_message: string | null
          id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          created_at?: string
          direction?: string
          entity_count?: number | null
          entity_type: string
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          direction?: string
          entity_count?: number | null
          entity_type?: string
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "external_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          id: string
          thread_id: string
          unread_count: number | null
          user_id: string
        }
        Insert: {
          id?: string
          thread_id: string
          unread_count?: number | null
          user_id: string
        }
        Update: {
          id?: string
          thread_id?: string
          unread_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_availability: {
        Row: {
          available_date: string
          created_at: string
          end_time: string | null
          id: string
          is_available: boolean | null
          notes: string | null
          operator_profile_id: string
          start_time: string | null
          truck_id: string
        }
        Insert: {
          available_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          operator_profile_id: string
          start_time?: string | null
          truck_id: string
        }
        Update: {
          available_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          operator_profile_id?: string
          start_time?: string | null
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "truck_availability_operator_profile_id_fkey"
            columns: ["operator_profile_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truck_availability_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "truck_units"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_units: {
        Row: {
          capacity_bushels: number | null
          capacity_tons: number | null
          created_at: string
          id: string
          license_plate: string | null
          make: string | null
          model: string | null
          operator_profile_id: string
          status: string
          truck_type: string
          year: number | null
        }
        Insert: {
          capacity_bushels?: number | null
          capacity_tons?: number | null
          created_at?: string
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          operator_profile_id: string
          status?: string
          truck_type?: string
          year?: number | null
        }
        Update: {
          capacity_bushels?: number | null
          capacity_tons?: number | null
          created_at?: string
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          operator_profile_id?: string
          status?: string
          truck_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "truck_units_operator_profile_id_fkey"
            columns: ["operator_profile_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      comm_method: "in_app" | "email" | "sms" | "phone"
      contract_status:
        | "draft"
        | "pending_signature"
        | "partially_signed"
        | "fully_signed"
        | "expired"
        | "voided"
      contract_type: "work_authorization" | "payment_agreement"
      credential_type:
        | "insurance"
        | "license"
        | "certification"
        | "registration"
        | "bond"
      crop_type:
        | "corn"
        | "soybeans"
        | "wheat"
        | "alfalfa"
        | "oats"
        | "sorghum"
        | "sunflower"
        | "canola"
        | "cotton"
        | "rice"
        | "barley"
        | "cover_crop"
        | "other"
      dispute_status:
        | "opened"
        | "under_review"
        | "resolved"
        | "escalated"
        | "closed"
      exception_type:
        | "weather_delay"
        | "partial_completion"
        | "no_show"
        | "field_inaccessible"
        | "missing_data"
        | "scope_change"
        | "pricing_change"
        | "equipment_failure"
        | "dispute"
      field_status: "idle" | "active" | "pending" | "restricted"
      file_category:
        | "boundary"
        | "prescription"
        | "planting"
        | "as_applied"
        | "harvest"
        | "soil_sample"
        | "photo"
        | "access_instructions"
        | "operator_notes"
        | "completion_photo"
        | "machine_data"
        | "invoice_doc"
        | "insurance"
        | "certification"
        | "other"
      file_format:
        | "geojson"
        | "shapefile"
        | "kml"
        | "csv"
        | "pdf"
        | "png"
        | "jpg"
        | "zip"
        | "isoxml"
        | "other"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "overdue"
        | "voided"
      job_status:
        | "draft"
        | "requested"
        | "quoted"
        | "accepted"
        | "scheduled"
        | "in_progress"
        | "delayed"
        | "completed"
        | "approved"
        | "invoiced"
        | "paid"
        | "closed"
        | "cancelled"
        | "disputed"
      network_member_status: "invited" | "active" | "suspended" | "removed"
      network_type:
        | "retailer"
        | "coop"
        | "ethanol_plant"
        | "grain_handler"
        | "other"
      network_visibility: "private" | "hybrid" | "public"
      operation_type:
        | "spraying"
        | "planting"
        | "harvest"
        | "tillage"
        | "hauling"
        | "scouting"
        | "soil_sampling"
        | "fertilizing"
        | "seeding"
        | "mowing"
        | "baling"
        | "drainage"
        | "other"
        | "rock_picking"
        | "grain_hauling"
      packet_status:
        | "pending"
        | "generating"
        | "ready"
        | "downloaded"
        | "expired"
        | "regenerating"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      permission_level:
        | "view"
        | "order_work"
        | "upload_files"
        | "approve_payment"
        | "manage"
        | "admin"
      pricing_model:
        | "per_acre"
        | "per_hour"
        | "flat_rate"
        | "negotiated"
        | "per_load"
        | "per_bushel"
        | "per_mile"
        | "day_rate"
      product_form: "dry" | "liquid" | "gas" | "granular" | "other"
      quote_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "countered"
      rate_type:
        | "flat"
        | "split"
        | "variable_rate"
        | "zone_based"
        | "see_and_spray"
      signature_status: "pending" | "signed" | "declined" | "expired"
      user_role: "grower" | "operator" | "farm_manager" | "admin" | "finance"
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
      comm_method: ["in_app", "email", "sms", "phone"],
      contract_status: [
        "draft",
        "pending_signature",
        "partially_signed",
        "fully_signed",
        "expired",
        "voided",
      ],
      contract_type: ["work_authorization", "payment_agreement"],
      credential_type: [
        "insurance",
        "license",
        "certification",
        "registration",
        "bond",
      ],
      crop_type: [
        "corn",
        "soybeans",
        "wheat",
        "alfalfa",
        "oats",
        "sorghum",
        "sunflower",
        "canola",
        "cotton",
        "rice",
        "barley",
        "cover_crop",
        "other",
      ],
      dispute_status: [
        "opened",
        "under_review",
        "resolved",
        "escalated",
        "closed",
      ],
      exception_type: [
        "weather_delay",
        "partial_completion",
        "no_show",
        "field_inaccessible",
        "missing_data",
        "scope_change",
        "pricing_change",
        "equipment_failure",
        "dispute",
      ],
      field_status: ["idle", "active", "pending", "restricted"],
      file_category: [
        "boundary",
        "prescription",
        "planting",
        "as_applied",
        "harvest",
        "soil_sample",
        "photo",
        "access_instructions",
        "operator_notes",
        "completion_photo",
        "machine_data",
        "invoice_doc",
        "insurance",
        "certification",
        "other",
      ],
      file_format: [
        "geojson",
        "shapefile",
        "kml",
        "csv",
        "pdf",
        "png",
        "jpg",
        "zip",
        "isoxml",
        "other",
      ],
      invoice_status: ["draft", "sent", "viewed", "paid", "overdue", "voided"],
      job_status: [
        "draft",
        "requested",
        "quoted",
        "accepted",
        "scheduled",
        "in_progress",
        "delayed",
        "completed",
        "approved",
        "invoiced",
        "paid",
        "closed",
        "cancelled",
        "disputed",
      ],
      network_member_status: ["invited", "active", "suspended", "removed"],
      network_type: [
        "retailer",
        "coop",
        "ethanol_plant",
        "grain_handler",
        "other",
      ],
      network_visibility: ["private", "hybrid", "public"],
      operation_type: [
        "spraying",
        "planting",
        "harvest",
        "tillage",
        "hauling",
        "scouting",
        "soil_sampling",
        "fertilizing",
        "seeding",
        "mowing",
        "baling",
        "drainage",
        "other",
        "rock_picking",
        "grain_hauling",
      ],
      packet_status: [
        "pending",
        "generating",
        "ready",
        "downloaded",
        "expired",
        "regenerating",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      permission_level: [
        "view",
        "order_work",
        "upload_files",
        "approve_payment",
        "manage",
        "admin",
      ],
      pricing_model: [
        "per_acre",
        "per_hour",
        "flat_rate",
        "negotiated",
        "per_load",
        "per_bushel",
        "per_mile",
        "day_rate",
      ],
      product_form: ["dry", "liquid", "gas", "granular", "other"],
      quote_status: ["pending", "accepted", "declined", "expired", "countered"],
      rate_type: [
        "flat",
        "split",
        "variable_rate",
        "zone_based",
        "see_and_spray",
      ],
      signature_status: ["pending", "signed", "declined", "expired"],
      user_role: ["grower", "operator", "farm_manager", "admin", "finance"],
    },
  },
} as const
