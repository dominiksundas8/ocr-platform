import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DocumentVault from "@/components/DocumentVault";

export default async function DocumentListPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : 'ALL';
  const page = typeof params.page === 'string' ? params.page : undefined;

  return (
      <DocumentVault 
        token={session?.accessToken} 
        status={status} 
        page={page} 
        mode="USER"
      />
  );
}

