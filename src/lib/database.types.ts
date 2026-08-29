export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "returned";

export type FormFieldType = "text" | "textarea" | "number";
export type BroadcastTarget = "all" | "unsubmitted";
export type CommentSender = "admin" | "group";

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
        };
        Insert: Partial<
          Database["public"]["Tables"]["submission_items"]["Row"]
        > & { submission_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["submission_items"]["Row"]>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
