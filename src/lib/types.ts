export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = Database["public"]["Enums"]["app_role"];

export type Database = {
  public: {
    Tables: {
      exam_programs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          exam_type: string;
          country: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          exam_type: string;
          country: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          exam_type?: string;
          country?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          current_group_id: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          current_group_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          current_group_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          exam_program_id: string;
          name: string;
          invite_code: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_program_id: string;
          name: string;
          invite_code: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_program_id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: AppRole;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: AppRole;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: AppRole;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          group_id: string;
          exam_program_id: string;
          name: string;
          board_weight: number;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          exam_program_id: string;
          name: string;
          board_weight?: number;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          exam_program_id?: string;
          name?: string;
          board_weight?: number;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          group_id: string;
          subject_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          subject_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          subject_id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_group_with_invite: {
        Args: {
          p_invite_code: string;
          p_full_name: string;
        };
        Returns: {
          group_id: string;
          group_name: string;
          exam_program_id: string;
          exam_program_name: string;
          role: AppRole;
        }[];
      };
      can_access_exam_program: {
        Args: {
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      is_group_member_for_exam: {
        Args: {
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      is_group_admin_for_exam: {
        Args: {
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      can_access_topic: {
        Args: {
          target_subject_id: string;
          target_group_id: string;
        };
        Returns: boolean;
      };
      can_manage_topic: {
        Args: {
          target_subject_id: string;
          target_group_id: string;
        };
        Returns: boolean;
      };
      is_group_admin: {
        Args: {
          target_group_id: string;
        };
        Returns: boolean;
      };
      is_group_member: {
        Args: {
          target_group_id: string;
        };
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "reviewer" | "admin" | "super_admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
