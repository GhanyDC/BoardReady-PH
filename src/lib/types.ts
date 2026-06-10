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
      questions: {
        Row: {
          id: string;
          exam_program_id: string;
          group_id: string;
          subject_id: string;
          topic_id: string;
          question_text: string;
          difficulty: string;
          bloom_level: string;
          rationale: string | null;
          source_type: string;
          status: string;
          created_by: string;
          verified_by: string | null;
          published_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_program_id: string;
          group_id: string;
          subject_id: string;
          topic_id: string;
          question_text: string;
          difficulty: string;
          bloom_level?: string;
          rationale?: string | null;
          source_type?: string;
          status?: string;
          created_by: string;
          verified_by?: string | null;
          published_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_program_id?: string;
          group_id?: string;
          subject_id?: string;
          topic_id?: string;
          question_text?: string;
          difficulty?: string;
          bloom_level?: string;
          rationale?: string | null;
          source_type?: string;
          status?: string;
          created_by?: string;
          verified_by?: string | null;
          published_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      choices: {
        Row: {
          id: string;
          question_id: string;
          choice_label: string;
          choice_text: string;
          is_correct: boolean;
          explanation: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          choice_label: string;
          choice_text: string;
          is_correct?: boolean;
          explanation?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          choice_label?: string;
          choice_text?: string;
          is_correct?: boolean;
          explanation?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_reports: {
        Row: {
          id: string;
          question_id: string;
          reported_by: string;
          report_type: string;
          message: string;
          status: string;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          reported_by: string;
          report_type: string;
          message: string;
          status?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          reported_by?: string;
          report_type?: string;
          message?: string;
          status?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      question_attempts: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          question_id: string;
          selected_choice_id: string;
          is_correct: boolean;
          confidence_rating: number | null;
          time_spent_seconds: number | null;
          attempt_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          question_id: string;
          selected_choice_id: string;
          is_correct?: boolean;
          confidence_rating?: number | null;
          time_spent_seconds?: number | null;
          attempt_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          question_id?: string;
          selected_choice_id?: string;
          is_correct?: boolean;
          confidence_rating?: number | null;
          time_spent_seconds?: number | null;
          attempt_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weak_areas: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          topic_id: string;
          accuracy: number;
          total_attempts: number;
          correct_attempts: number;
          wrong_attempts: number;
          average_confidence: number | null;
          priority: string;
          last_attempted_at: string;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          topic_id: string;
          accuracy: number;
          total_attempts: number;
          correct_attempts: number;
          wrong_attempts: number;
          average_confidence?: number | null;
          priority: string;
          last_attempted_at: string;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          subject_id?: string;
          topic_id?: string;
          accuracy?: number;
          total_attempts?: number;
          correct_attempts?: number;
          wrong_attempts?: number;
          average_confidence?: number | null;
          priority?: string;
          last_attempted_at?: string;
          last_updated?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      external_drill_logs: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          topic_id: string | null;
          drill_title: string;
          source_label: string | null;
          total_items: number;
          score: number;
          percentage: number;
          mistake_notes: string | null;
          weak_topic_notes: string | null;
          date_taken: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          topic_id?: string | null;
          drill_title: string;
          source_label?: string | null;
          total_items: number;
          score: number;
          mistake_notes?: string | null;
          weak_topic_notes?: string | null;
          date_taken?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          subject_id?: string;
          topic_id?: string | null;
          drill_title?: string;
          source_label?: string | null;
          total_items?: number;
          score?: number;
          mistake_notes?: string | null;
          weak_topic_notes?: string | null;
          date_taken?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mock_exams: {
        Row: {
          id: string;
          exam_program_id: string;
          group_id: string;
          title: string;
          description: string | null;
          mock_type: string;
          item_count: number;
          time_limit_minutes: number;
          status: string;
          created_by: string;
          published_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_program_id: string;
          group_id: string;
          title: string;
          description?: string | null;
          mock_type?: string;
          item_count: number;
          time_limit_minutes: number;
          status?: string;
          created_by: string;
          published_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_program_id?: string;
          group_id?: string;
          title?: string;
          description?: string | null;
          mock_type?: string;
          item_count?: number;
          time_limit_minutes?: number;
          status?: string;
          created_by?: string;
          published_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mock_exam_items: {
        Row: {
          id: string;
          mock_exam_id: string;
          question_id: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          mock_exam_id: string;
          question_id: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          mock_exam_id?: string;
          question_id?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      mock_exam_attempts: {
        Row: {
          id: string;
          mock_exam_id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          started_at: string;
          submitted_at: string | null;
          time_spent_seconds: number | null;
          score: number | null;
          total_items: number;
          percentage: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mock_exam_id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          started_at?: string;
          submitted_at?: string | null;
          time_spent_seconds?: number | null;
          score?: number | null;
          total_items?: number;
          percentage?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mock_exam_id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          started_at?: string;
          submitted_at?: string | null;
          time_spent_seconds?: number | null;
          score?: number | null;
          total_items?: number;
          percentage?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mock_exam_answers: {
        Row: {
          id: string;
          mock_exam_attempt_id: string;
          question_id: string;
          selected_choice_id: string;
          is_correct: boolean;
          time_spent_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mock_exam_attempt_id: string;
          question_id: string;
          selected_choice_id: string;
          is_correct?: boolean;
          time_spent_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mock_exam_attempt_id?: string;
          question_id?: string;
          selected_choice_id?: string;
          is_correct?: boolean;
          time_spent_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      readiness_snapshots: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          overall_readiness: number;
          practice_component: number | null;
          mock_exam_component: number | null;
          weak_area_component: number | null;
          study_consistency_component: number | null;
          external_drill_component: number | null;
          subject_breakdown: Json;
          recommendation_summary: Json;
          calculated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          overall_readiness: number;
          practice_component?: number | null;
          mock_exam_component?: number | null;
          weak_area_component?: number | null;
          study_consistency_component?: number | null;
          external_drill_component?: number | null;
          subject_breakdown?: Json;
          recommendation_summary?: Json;
          calculated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          overall_readiness?: number;
          practice_component?: number | null;
          mock_exam_component?: number | null;
          weak_area_component?: number | null;
          study_consistency_component?: number | null;
          external_drill_component?: number | null;
          subject_breakdown?: Json;
          recommendation_summary?: Json;
          calculated_at?: string;
          created_at?: string;
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
      study_preferences: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          daily_goal_minutes: number;
          weekly_goal_minutes: number;
          preferred_session_length_minutes: number;
          preferred_study_time: string;
          preferred_study_style: string;
          weakness_strategy: string;
          rest_days: string[];
          target_exam_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          daily_goal_minutes?: number;
          weekly_goal_minutes?: number;
          preferred_session_length_minutes?: number;
          preferred_study_time?: string;
          preferred_study_style?: string;
          weakness_strategy?: string;
          rest_days?: string[];
          target_exam_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          daily_goal_minutes?: number;
          weekly_goal_minutes?: number;
          preferred_session_length_minutes?: number;
          preferred_study_time?: string;
          preferred_study_style?: string;
          weakness_strategy?: string;
          rest_days?: string[];
          target_exam_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string | null;
          topic_id: string | null;
          activity_type: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number;
          focus_rating: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id?: string | null;
          topic_id?: string | null;
          activity_type: string;
          started_at: string;
          ended_at?: string | null;
          duration_seconds: number;
          focus_rating?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          exam_program_id?: string;
          subject_id?: string | null;
          topic_id?: string | null;
          activity_type?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number;
          focus_rating?: number | null;
          notes?: string | null;
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
    Views: {
      subject_attempt_analytics: {
        Row: {
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          subject_name: string;
          board_weight: number;
          total_attempts: number;
          correct_attempts: number;
          wrong_attempts: number;
          accuracy: number;
          confidence_attempts: number;
          average_confidence: number | null;
          latest_attempted_at: string;
        };
        Relationships: [];
      };
      topic_attempt_analytics: {
        Row: {
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          subject_name: string;
          topic_id: string;
          topic_name: string;
          total_attempts: number;
          correct_attempts: number;
          wrong_attempts: number;
          accuracy: number;
          confidence_attempts: number;
          average_confidence: number | null;
          latest_attempted_at: string;
        };
        Relationships: [];
      };
    };
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
      is_active_study_context: {
        Args: {
          target_user_id: string;
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      is_valid_study_subject: {
        Args: {
          target_subject_id: string | null;
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      is_valid_study_topic: {
        Args: {
          target_topic_id: string | null;
          target_subject_id: string | null;
          target_group_id: string;
        };
        Returns: boolean;
      };
      can_manage_own_study_session: {
        Args: {
          target_user_id: string;
          target_group_id: string;
          target_exam_program_id: string;
          target_subject_id: string | null;
          target_topic_id: string | null;
        };
        Returns: boolean;
      };
      is_valid_question_context: {
        Args: {
          target_group_id: string;
          target_exam_program_id: string;
          target_subject_id: string;
          target_topic_id: string;
        };
        Returns: boolean;
      };
      can_read_question: {
        Args: {
          target_question_id: string;
        };
        Returns: boolean;
      };
      can_insert_question_choice: {
        Args: {
          target_question_id: string;
        };
        Returns: boolean;
      };
      can_manage_question_report: {
        Args: {
          target_question_id: string;
        };
        Returns: boolean;
      };
      assert_question_publishable: {
        Args: {
          target_question_id: string;
        };
        Returns: undefined;
      };
      can_create_question_attempt: {
        Args: {
          target_user_id: string;
          target_group_id: string;
          target_exam_program_id: string;
          target_question_id: string;
          target_selected_choice_id: string;
        };
        Returns: boolean;
      };
      can_manage_external_drill_log: {
        Args: {
          target_user_id: string;
          target_group_id: string;
          target_exam_program_id: string;
          target_subject_id: string;
          target_topic_id: string | null;
        };
        Returns: boolean;
      };
      can_read_mock_exam: {
        Args: {
          target_mock_exam_id: string;
        };
        Returns: boolean;
      };
      can_manage_mock_exam: {
        Args: {
          target_mock_exam_id: string;
        };
        Returns: boolean;
      };
      can_create_mock_exam_item: {
        Args: {
          target_mock_exam_id: string;
          target_question_id: string;
        };
        Returns: boolean;
      };
      can_start_mock_exam_attempt: {
        Args: {
          target_user_id: string;
          target_mock_exam_id: string;
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      can_update_own_mock_exam_attempt: {
        Args: {
          target_user_id: string;
          target_mock_exam_id: string;
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: boolean;
      };
      can_read_mock_exam_attempt: {
        Args: {
          target_mock_exam_attempt_id: string;
        };
        Returns: boolean;
      };
      can_create_mock_exam_answer: {
        Args: {
          target_mock_exam_attempt_id: string;
          target_question_id: string;
          target_selected_choice_id: string;
        };
        Returns: boolean;
      };
      submit_mock_exam_attempt: {
        Args: {
          target_mock_exam_attempt_id: string;
          submitted_answers: Json;
          target_time_spent_seconds: number;
        };
        Returns: string;
      };
      save_readiness_snapshot: {
        Args: {
          target_user_id: string;
          target_group_id: string;
          target_exam_program_id: string;
          target_overall_readiness: number;
          target_practice_component: number | null;
          target_mock_exam_component: number | null;
          target_weak_area_component: number | null;
          target_study_consistency_component: number | null;
          target_external_drill_component: number | null;
          target_subject_breakdown: Json;
          target_recommendation_summary: Json;
        };
        Returns: string;
      };
      weak_area_priority: {
        Args: {
          target_accuracy: number;
        };
        Returns: string;
      };
      refresh_user_weak_areas: {
        Args: {
          target_group_id: string;
          target_exam_program_id: string;
        };
        Returns: {
          id: string;
          user_id: string;
          group_id: string;
          exam_program_id: string;
          subject_id: string;
          topic_id: string;
          accuracy: number;
          total_attempts: number;
          correct_attempts: number;
          wrong_attempts: number;
          average_confidence: number | null;
          priority: string;
          last_attempted_at: string;
          last_updated: string;
          created_at: string;
        }[];
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
