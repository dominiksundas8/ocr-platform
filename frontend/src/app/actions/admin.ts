'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * Azione Server per la cancellazione di un account utente.
 */
export async function deleteUserAction(id: number | string) {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  // Sicurezza: solo gli Admin possono cancellare utenti
  if (!token || !session?.user?.isStaff) {
    return { error: "Non autorizzato. Permessi insufficienti." };
  }

  try {
    await api.admin.deleteUser(id, token);
    
    // Revalidiamo la lista utenti globale
    revalidatePath("/dashboard/admin");
    
    return { success: true };
  } catch (error: any) {
    console.error("Server Action Delete User Error:", error);
    return { error: error.message || "Impossibile eliminare l'utente." };
  }
}
