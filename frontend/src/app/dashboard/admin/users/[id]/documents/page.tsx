import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DocumentVault from "@/components/DocumentVault";

export default async function AdminUserDocumentsPage({ 
  params: paramsPromise,
  searchParams: searchParamsPromise
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const session = await getServerSession(authOptions);
  const { id } = await paramsPromise;
  const params = await searchParamsPromise;
  const page = params.page;
  const status = typeof params.status === 'string' ? params.status : 'ALL';

  return (
      <DocumentVault 
        token={session?.accessToken} 
        status={status} 
        page={page} 
        targetUserId={id}
        mode="ADMIN"
      />
  );
}

