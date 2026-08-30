export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "returned";

export type FormFieldType = "text" | "textarea" | "number";
export type BroadcastTarget = "all" | "unsubmitted";
export type CommentSender = "admin" | "group";
export type ItemKind = "purchase" | "borrow";
export type StockStatus = "pending" | "secured" | "denied";
export type Affiliation = "1年" | "2年" | "3年" | "部活" | "有志";
export type Area = "校内" | "校外";
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
