import { AtualizarSenhaForm } from "../atualizar-senha/AtualizarSenhaForm";

export const metadata = {
  title: "Redefinir senha",
  description: "Defina uma nova senha para sua conta FINDER",
};

export default function RedefinirSenhaPage() {
  return <AtualizarSenhaForm />;
}
