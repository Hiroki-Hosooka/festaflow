export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "returned";

export type FormFieldType = "text" | "textarea" | "number";
export type BroadcastTarget = "all" | "unsubmitted" | "custom";
export type CommentSender = "admin" | "group";
export type ItemKind = "purchase" | "borrow";
export type StockStatus = "pending" | "secured" | "denied";
// 所属区分・エリアの選択肢は classification_options テーブルで管理者が自由に編集できる
export type Affiliation = string;
export type Area = string;
export type Genre = string;
export type ClassificationCategory = "affiliation" | "area" | "genre";
export type PushSubscriptionKind = "admin" | "group";
export type ReviewStatus = "pending" | "approved" | "needs_fix";
export type TodoStatus = "not_started" | "in_progress" | "done";
export type PreferenceKind = "ng" | "want";

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          slug: string;
          name: string;
          admin_login_id: string;
          admin_password_hash: string;
          admin_label: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          slug: string;
          name: string;
          admin_login_id: string;
          admin_password_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          passphrase_hash: string;
          member_passphrase_hash: string | null;
          budget_allocated: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["groups"]["Row"]> & {
          event_id: string;
          name: string;
          passphrase_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Row"]>;
        Relationships: [];
      };
      form_fields: {
        Row: {
          id: string;
          event_id: string;
          key: string;
          label: string;
          field_type: FormFieldType;
          required: boolean;
          sort_order: number;
          applicable_genres: string[] | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["form_fields"]["Row"]> & {
          event_id: string;
          key: string;
          label: string;
          field_type: FormFieldType;
        };
        Update: Partial<Database["public"]["Tables"]["form_fields"]["Row"]>;
        Relationships: [];
      };
      submission_schedules: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          deadline: string;
          hint: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["submission_schedules"]["Row"]> & {
          event_id: string;
          title: string;
          deadline: string;
        };
        Update: Partial<Database["public"]["Tables"]["submission_schedules"]["Row"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          event_id: string;
          kind: PushSubscriptionKind;
          group_id: string | null;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          event_id: string;
          kind: PushSubscriptionKind;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
        Relationships: [];
      };
      schedule_reminders_sent: {
        Row: {
          id: string;
          schedule_id: string;
          threshold: string;
          sent_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schedule_reminders_sent"]["Row"]> & {
          schedule_id: string;
          threshold: string;
        };
        Update: Partial<Database["public"]["Tables"]["schedule_reminders_sent"]["Row"]>;
        Relationships: [];
      };
      classification_options: {
        Row: {
          id: string;
          event_id: string;
          category: ClassificationCategory;
          value: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classification_options"]["Row"]> & {
          event_id: string;
          category: ClassificationCategory;
          value: string;
        };
        Update: Partial<Database["public"]["Tables"]["classification_options"]["Row"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          event_id: string;
          group_id: string;
          name: string;
          content: string;
          location: string;
          status: SubmissionStatus;
          admin_comment: string;
          affiliation: Affiliation | null;
          area: Area | null;
          genre: Genre | null;
          teacher_check: boolean;
          submitted_at: string | null;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["submissions"]["Row"]> & {
          event_id: string;
          group_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Row"]>;
        Relationships: [];
      };
      submission_items: {
        Row: {
          id: string;
          submission_id: string;
          name: string;
          quantity: number;
          unit_price: number;
          sort_order: number;
          kind: ItemKind;
          inventory_item_id: string | null;
          stock_status: StockStatus;
          secured_quantity: number;
        };
        Insert: Partial<
          Database["public"]["Tables"]["submission_items"]["Row"]
        > & { submission_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["submission_items"]["Row"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          total_quantity: number;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_items"]["Row"]> & {
          event_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Row"]>;
        Relationships: [];
      };
      submission_field_values: {
        Row: {
          id: string;
          submission_id: string;
          field_id: string;
          value: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["submission_field_values"]["Row"]
        > & { submission_id: string; field_id: string };
        Update: Partial<
          Database["public"]["Tables"]["submission_field_values"]["Row"]
        >;
        Relationships: [];
      };
      broadcasts: {
        Row: {
          id: string;
          event_id: string;
          target_type: BroadcastTarget;
          target_group_ids: string[] | null;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["broadcasts"]["Row"]> & {
          event_id: string;
          target_type: BroadcastTarget;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["broadcasts"]["Row"]>;
        Relationships: [];
      };
      submission_comments: {
        Row: {
          id: string;
          submission_id: string;
          sender_type: CommentSender;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["submission_comments"]["Row"]
        > & { submission_id: string; sender_type: CommentSender; body: string };
        Update: Partial<
          Database["public"]["Tables"]["submission_comments"]["Row"]
        >;
        Relationships: [];
      };
      submission_attachments: {
        Row: {
          id: string;
          submission_id: string;
          file_name: string;
          storage_path: string;
          review_status: ReviewStatus;
          review_comment: string;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["submission_attachments"]["Row"]> & {
          submission_id: string;
          file_name: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["submission_attachments"]["Row"]>;
        Relationships: [];
      };
      submission_attachment_comments: {
        Row: {
          id: string;
          attachment_id: string;
          sender_type: CommentSender;
          body: string;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["submission_attachment_comments"]["Row"]
        > & { attachment_id: string; sender_type: CommentSender; body: string };
        Update: Partial<
          Database["public"]["Tables"]["submission_attachment_comments"]["Row"]
        >;
        Relationships: [];
      };
      event_documents: {
        Row: {
          id: string;
          event_id: string;
          file_name: string;
          storage_path: string;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_documents"]["Row"]> & {
          event_id: string;
          file_name: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_documents"]["Row"]>;
        Relationships: [];
      };
      todo_groups: {
        Row: {
          id: string;
          submission_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["todo_groups"]["Row"]> & {
          submission_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["todo_groups"]["Row"]>;
        Relationships: [];
      };
      todo_tasks: {
        Row: {
          id: string;
          submission_id: string;
          todo_group_id: string | null;
          title: string;
          status: TodoStatus;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["todo_tasks"]["Row"]> & {
          submission_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["todo_tasks"]["Row"]>;
        Relationships: [];
      };
      shift_configs: {
        Row: {
          submission_id: string;
          start_time: string;
          end_time: string;
          slot_minutes: number;
          people_per_slot: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_configs"]["Row"]> & {
          submission_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["shift_configs"]["Row"]>;
        Relationships: [];
      };
      shift_members: {
        Row: {
          id: string;
          submission_id: string;
          name: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_members"]["Row"]> & {
          submission_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["shift_members"]["Row"]>;
        Relationships: [];
      };
      shift_preferences: {
        Row: {
          id: string;
          submission_id: string;
          member_id: string;
          slot_label: string;
          kind: PreferenceKind;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_preferences"]["Row"]> & {
          submission_id: string;
          member_id: string;
          slot_label: string;
          kind: PreferenceKind;
        };
        Update: Partial<Database["public"]["Tables"]["shift_preferences"]["Row"]>;
        Relationships: [];
      };
      shift_assignments: {
        Row: {
          id: string;
          submission_id: string;
          slot_label: string;
          member_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_assignments"]["Row"]> & {
          submission_id: string;
          slot_label: string;
          member_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["shift_assignments"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
