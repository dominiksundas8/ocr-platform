import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { api } from "@/lib/api";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Il Tuo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "mario@esempio.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const data: any = await api.auth.login(credentials);
          
          if (data && data.access) {
             return {
                id: data.user.pk,
                email: data.user.email,
                accessToken: data.access,
                isStaff: data.user.is_staff,
             } as any;
          }
          return null;
        } catch (e) {
          console.error("Connessione Django Fallita:", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken;
        token.isStaff = user.isStaff;
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).accessToken = token.accessToken;
      if (session.user) {
         (session.user as any).isStaff = token.isStaff;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { 
     signIn: '/login'
  }
});

export { handler as GET, handler as POST };
