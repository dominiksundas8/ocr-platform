'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * Azione Server per la cancellazione di un documento.
 */
export async function deleteDocumentAction(id: string) {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  if (!token) {
    return { error: "Sessione non valida o scaduta" };
  }

  try {
    await api.documents.delete(id, token);
    
    // Revalidiamo i percorsi che mostrano la lista documenti
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/admin/users/[id]/documents", "page");
    
    return { success: true };
  } catch (error: any) {
    console.error("Server Action Delete Error:", error);
    return { error: error.message || "Errore durante la cancellazione" };
  }
}

/**
 * Azione Server per l'upload di un documento.
 * Gestisce FormData contenente il file.
 */
export async function uploadDocumentAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  if (!token) {
    return { error: "Sessione non valida o scaduta" };
  }

  try {
    const data = await api.documents.upload(formData, token);
    
    // Revalidiamo l'archivio per mostrare il nuovo documento "PENDING"
    revalidatePath("/dashboard/documents");
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Server Action Upload Error:", error);
    return { error: error.message || "Errore durante l'upload" };
  }
}

/**
 * Azione Server per ottenere i dettagli di un documento.
 */
export async function getDocumentByIdAction(id: string) {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  if (!token) {
    return { error: "Sessione non valida o scaduta" };
  }

  try {
    const data = await api.documents.getById(id, token);
    return { success: true, data };
  } catch (error: any) {
    console.error("Server Action Get Error:", error);
    return { error: error.message || "Errore nel recupero del documento" };
  }
}
