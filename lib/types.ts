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

export type ChatRole = "user" | "assistant";

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
  logo_url: string | null;
  created_at: string;
}

export type LayerType = "background" | "shape" | "text" | "image" | "logo";

export type ColorSlot =
  | "primary"
  | "secondary"
  | "accent"
  | "white"
  | "black"
  | "transparent";

export interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: "background";
  fill: ColorSlot | string;
  gradient?: { angle: number; from: string; to: string };
}

export interface ShapeLayer extends BaseLayer {
  type: "shape";
  shape: "rect" | "circle" | "triangle" | "line";
  fill: ColorSlot | string;
  borderRadius: number;
  stroke?: { color: string; width: number };
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700 | 800;
  color: ColorSlot | string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  uppercase: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  fit: "cover" | "contain" | "fill";
}

export interface LogoLayer extends BaseLayer {
  type: "logo";
  fit: "contain";
}

export type EditorLayer =
  | BackgroundLayer
  | ShapeLayer
  | TextLayer
  | ImageLayer
  | LogoLayer;

export interface CanvasTemplate {
  id: string;
  name: string;
  format: "feed" | "story" | "carousel_cover";
  category:
    | "institucional"
    | "produto"
    | "promocional"
    | "depoimento"
    | "conteudo";
  canvasWidth: number;
  canvasHeight: number;
  layers: EditorLayer[];
  thumbnail?: string;
  created_at: string;
  user_id?: string;
  client_id?: string;
  is_default: boolean;
}

export interface AITemplateSuggestion {
  name: string;
  rationale: string;
  layers: EditorLayer[];
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

export interface BrandChatAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
}

export interface BrandChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  attachments: BrandChatAttachment[];
  createdAt: string;
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
  logo_url: string;
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
        Insert: {
          id?: string;
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
          logo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<{
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
          logo_url: string | null;
        }>;
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
      canvas_templates: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          name: string;
          format: "feed" | "story" | "carousel_cover";
          category: string;
          canvas_width: number;
          canvas_height: number;
          layers: Json;
          thumbnail: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          name: string;
          format: "feed" | "story" | "carousel_cover";
          category: string;
          canvas_width?: number;
          canvas_height?: number;
          layers?: Json;
          thumbnail?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          client_id: string | null;
          name: string;
          format: "feed" | "story" | "carousel_cover";
          category: string;
          canvas_width: number;
          canvas_height: number;
          layers: Json;
          thumbnail: string | null;
          is_default: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "canvas_templates_client_id_fkey";
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
