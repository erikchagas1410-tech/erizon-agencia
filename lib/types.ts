export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AgentKey =
  | "strategist"
  | "copywriter"
  | "artDirector"
  | "trafficManager"
  | "analyst";

export type OutputLanguage = "pt-BR" | "en-US" | "es-ES";

export interface ClientProfile {
  id: string;
  user_id: string;
  name: string;
  voice_tone: string;
  personality: string;
  core_values: string;
  main_objective: string;
  post_sign_off: string;
  value_proposition: string;
  content_style: string;
  visual_aesthetic: string;
  reason_to_exist: string;
  content_pillars: string[];
  brand_character: string;
  brand_colors: string;
  created_at: string;
}

export type CampaignResults = Record<AgentKey, string>;

export interface CampaignRecord {
  id: string;
  user_id: string;
  client_id: string;
  request: string;
  results: CampaignResults;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

export interface BrandTheme {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  palette: string[];
  typography: {
    heading: string;
    body: string;
  };
  mood: string;
  keywords: string[];
}

export interface ClientFormValues {
  name: string;
  voice_tone: string;
  personality: string;
  core_values: string;
  main_objective: string;
  post_sign_off: string;
  value_proposition: string;
  content_style: string;
  visual_aesthetic: string;
  reason_to_exist: string;
  content_pillars: string;
  brand_character: string;
  brand_colors: string;
}

export interface AgentDefinition {
  key: AgentKey;
  label: string;
  badge: string;
  accent: string;
  description: string;
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: ClientProfile;
        Insert: Omit<ClientProfile, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ClientProfile, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          request: string;
          results: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          request: string;
          results: Json;
          created_at?: string;
        };
        Update: Partial<{
          request: string;
          results: Json;
        }>;
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
