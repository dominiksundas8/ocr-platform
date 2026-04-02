import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { api } from "@/lib/api";

/**
 * Helper per il refresh del token JWT di Django tramite l'endpoint del backend.
 */
async function refreshAccessToken(token: any) {
  try {
    const refreshedTokens = await api.auth.refresh(token.refreshToken);

    return {
      ...token,
      accessToken: refreshedTokens.access,
      refreshToken: refreshedTokens.refresh ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 45 * 60 - 30, // 45 min meno 30 secondi di buffer
    };
  } catch (error) {
    console.error("Errore nel refresh del token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
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
                refreshToken: data.refresh,
                isStaff: data.user.is_staff,
             };
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
        token.refreshToken = user.refreshToken;
        token.isStaff = user.isStaff;
        token.expiresAt = Math.floor(Date.now() / 1000) + 45 * 60 - 30;
        return token;
      }

      if (Math.floor(Date.now() / 1000) < (token.expiresAt as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      session.error = token.error;
      
      if (session.user) {
         session.user.isStaff = token.isStaff;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { 
     signIn: '/login'
  }
};
