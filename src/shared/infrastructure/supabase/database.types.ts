export type Database = {
  public: {
    Tables: {
      baby_profiles: {
        Row: {
          id: string;
          name: string;
          birth_date: string;
          cipa: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          birth_date: string;
          cipa?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birth_date?: string;
          cipa?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weight_entries: {
        Row: {
          id: string;
          measured_on: string;
          weight_grams: number;
          place: "hospital" | "pediatra" | "farmacia";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          measured_on: string;
          weight_grams: number;
          place: "hospital" | "pediatra" | "farmacia";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          measured_on?: string;
          weight_grams?: number;
          place?: "hospital" | "pediatra" | "farmacia";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      planned_vaccine_doses: {
        Row: {
          id: string;
          vaccine_name: string;
          dose_label: string;
          planned_date: string;
          age_label: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vaccine_name: string;
          dose_label: string;
          planned_date: string;
          age_label?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vaccine_name?: string;
          dose_label?: string;
          planned_date?: string;
          age_label?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applied_vaccine_doses: {
        Row: {
          id: string;
          planned_dose_id: string | null;
          applied_on: string;
          vaccine_name: string;
          dose_label: string;
          place: string;
          lot: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          planned_dose_id?: string | null;
          applied_on: string;
          vaccine_name: string;
          dose_label: string;
          place: string;
          lot?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          planned_dose_id?: string | null;
          applied_on?: string;
          vaccine_name?: string;
          dose_label?: string;
          place?: string;
          lot?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applied_vaccine_doses_planned_dose_id_fkey";
            columns: ["planned_dose_id"];
            isOneToOne: false;
            referencedRelation: "planned_vaccine_doses";
            referencedColumns: ["id"];
          },
        ];
      };
      developer_backup_runs: {
        Row: {
          id: string;
          started_at: string;
          finished_at: string;
          status: "success" | "failed";
          file_name: string | null;
          file_size_bytes: number | null;
          sha256: string | null;
          duration_ms: number;
          retained_count: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          started_at: string;
          finished_at: string;
          status: "success" | "failed";
          file_name?: string | null;
          file_size_bytes?: number | null;
          sha256?: string | null;
          duration_ms: number;
          retained_count?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          started_at?: string;
          finished_at?: string;
          status?: "success" | "failed";
          file_name?: string | null;
          file_size_bytes?: number | null;
          sha256?: string | null;
          duration_ms?: number;
          retained_count?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      travel_checklist_items: {
        Row: {
          id: string;
          label: string;
          category: "comida" | "higiene" | "cambio" | "sueno" | "salud" | "paseo" | "documentacion";
          sort_order: number;
          is_packed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          category: "comida" | "higiene" | "cambio" | "sueno" | "salud" | "paseo" | "documentacion";
          sort_order?: number;
          is_packed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          category?:
            "comida" | "higiene" | "cambio" | "sueno" | "salud" | "paseo" | "documentacion";
          sort_order?: number;
          is_packed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
