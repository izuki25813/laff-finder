import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Login",
  description: "Acesse sua conta LAFF Finder",
};

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
