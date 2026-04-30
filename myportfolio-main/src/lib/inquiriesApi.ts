import { supabase } from "./supabase";

export interface Inquiry {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface InquiryRow {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

const fromRow = (r: InquiryRow): Inquiry => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name ?? "",
  email: r.email,
  subject: r.subject ?? "",
  message: r.message,
  read: r.read,
  createdAt: r.created_at,
});

export interface NewInquiryInput {
  firstName: string;
  lastName?: string;
  email: string;
  subject?: string;
  message: string;
}

export async function createInquiry(input: NewInquiryInput): Promise<void> {
  const { error } = await supabase.from("inquiries").insert({
    first_name: input.firstName,
    last_name: input.lastName ?? "",
    email: input.email,
    subject: input.subject ?? "",
    message: input.message,
  });
  if (error) throw new Error(`Failed to save inquiry: ${error.message}`);
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load inquiries: ${error.message}`);
  return (data ?? []).map((r) => fromRow(r as InquiryRow));
}

export async function markInquiryRead(id: number, read: boolean): Promise<void> {
  const { error } = await supabase
    .from("inquiries")
    .update({ read })
    .eq("id", id);
  if (error) throw new Error(`Failed to update inquiry: ${error.message}`);
}

export async function deleteInquiry(id: number): Promise<void> {
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete inquiry: ${error.message}`);
}
