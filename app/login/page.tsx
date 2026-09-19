import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
import { getSafeInternalPath } from "@/lib/safe-redirect";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Login",
  description: "Acesse sua conta FINDER",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  const paramsValue = (await searchParams) ?? {};
  const next = getSafeInternalPath(paramsValue.next, "/dashboard");

  if (session) {
    redirect(next);
  }

  return <LoginForm next={next} />;
}
