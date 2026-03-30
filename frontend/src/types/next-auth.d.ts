import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Estende l'oggetto session per includere i token JWT di Django
   */
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";
    user: {
      isStaff?: boolean;
    } & DefaultSession["user"];
  }

  /**
   * Estende l'oggetto user ritornato da authorize
   */
  interface User {
    accessToken?: string;
    refreshToken?: string;
    isStaff?: boolean;
  }
}

declare module "next-auth/jwt" {
  /**
   * Estende il token JWT interno di NextAuth
   */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    isStaff?: boolean;
    error?: "RefreshAccessTokenError";
  }
}
