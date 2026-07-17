export type Database = {
  public: {
    Tables: {
      baby_profiles: {
        Row: {
          id: string;
          name: string;
          birth_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          birth_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birth_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      weight_entries: {
        Row: {
          id: string;
          measured_on: string;
          weight_grams: number;
          place: "pediatra" | "farmacia";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          measured_on: string;
          weight_grams: number;
          place: "pediatra" | "farmacia";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          measured_on?: string;
          weight_grams?: number;
          place?: "pediatra" | "farmacia";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
      };
    };
  };
};
