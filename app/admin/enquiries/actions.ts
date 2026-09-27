"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteEnquiry, getEnquiryByIdAdmin, setEnquiryStatus } from "@/lib/db/queries";
import { deleteEnquiryPhotos } from "@/lib/storage";
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
  const enquiry = await getEnquiryByIdAdmin(id);
  await deleteEnquiry(id);
  await deleteEnquiryPhotos(enquiry?.photos.map((photo) => photo.key) ?? []);

  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries?deleted=1");
}
