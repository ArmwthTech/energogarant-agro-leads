import { auth } from "@clerk/nextjs/server";

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function requireUser() {
  if (!isClerkConfigured()) {
    return null;
  }

  const session = await auth();
  return session.userId ?? null;
}
