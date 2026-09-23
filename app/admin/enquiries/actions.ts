"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteEnquiry, setEnquiryStatus } from "@/lib/db/queries";
import type { EnquiryStatusValue } from "@/lib/db/schema";

export async function setEnquiryStatusAction(id: string, status: EnquiryStatusValue): Promise<void> {
  await requireAdmin();
  await setEnquiryStatus(id, status);

  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  redirect(`/admin/enquiries/${id}?${status === "handled" ? "handled" : "reopened"}=1`);
}

export async function deleteEnquiryAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteEnquiry(id);

  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries?deleted=1");
}
