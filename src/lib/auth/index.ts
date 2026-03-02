import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BASE_URL!,
    process.env.NEXT_PUBLIC_FRONTEND_URL!,
  ],
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
      },
      displayUsername: {
        type: "string",
        required: false,
      },
      gender: {
        type: "boolean",
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
