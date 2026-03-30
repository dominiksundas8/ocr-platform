"use client";

import DocumentVaultView from "@/components/DocumentVaultView";
import React from "react";

export default function AdminUserDocumentsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  
  return <DocumentVaultView userId={params.id} isAdminView={true} />;
}
