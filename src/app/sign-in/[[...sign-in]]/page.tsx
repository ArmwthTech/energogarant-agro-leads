import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6">
        <section className="max-w-md rounded-md border border-[#d9dde5] bg-white p-6">
          <h1 className="text-xl font-semibold">Clerk не подключен</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Добавьте переменные Clerk из Vercel Marketplace, затем redeploy.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6">
      <SignIn />
    </main>
  );
}
