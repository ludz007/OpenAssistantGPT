// File: /lib/auth.ts

import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

// Import the Prisma client you just defined above
import { db } from "./db";
// Import your “send welcome email” helper (adjust path if needed)
import { sendWelcomeEmail } from "./emails/send-welcome";

export const authOptions: NextAuthOptions = {
  // Tell NextAuth to use Prisma (db) as its adapter
  adapter: PrismaAdapter(db as any),

  // Secret for encrypting JWT sessions
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  // Override the default sign-in page
  pages: {
    signIn: "/login",
  },

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    // When NextAuth creates a session object, attach the user’s ID, name, email, image
    async session({ token, session }) {
      if (token) {
        session!.user!.id = token.id;
        session!.user!.name = token.name;
        session!.user!.email = token.email;
        session!.user!.image = token.picture;
      }
      return session;
    },

    // When NextAuth is issuing a JWT, look up (or attach) the user’s ID in token
    async jwt({ token, user }) {
      // First, see if we have a user in the database with this email
      const dbUser = await db.user.findFirst({
        where: { email: token.email! },
      });

      if (!dbUser) {
        // If not yet in DB but `user` is truthy (on first sign‐in), attach the user ID:
        if (user) {
          token.id = user.id;
        }
        return token;
      }

      // If the user exists in DB, return a new token object with their details:
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
  },

  events: {
    // When a new user is created, send them a welcome email
    async createUser(message) {
      const params = {
        name: message.user.name!,
        email: message.user.email!,
      };
      await sendWelcomeEmail(params);
    },
  },
};
