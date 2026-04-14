"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/actions/auth/signUp";

export default function CadastroPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({ name, email, password });
    if (result.error) {
      setErrorMessage(
        result.code === "EMAIL_IN_USE"
          ? "Este e-mail já está cadastrado"
          : result.message,
      );
      setIsSubmitting(false);
      return;
    }
    toast.success("Conta criada com sucesso!", {
      description: "Você será redirecionado para o login.",
    });
    setTimeout(() => {
      router.replace("/auth/login");
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-muted/40 flex flex-col lg:h-screen">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <div className="hidden lg:flex items-center justify-center p-4">
          <section className="relative h-full w-full overflow-hidden rounded-xl">
            <Image
              src="/login-image.png"
              alt="JusCash"
              fill
              priority
              className="object-cover"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
            <div className="absolute left-6 top-6 max-w-[80%] text-white">
              <Image
                src="/logo.svg"
                alt="JusCash"
                width={160}
                height={40}
                priority
                className="h-9 w-auto"
              />
              <p className="mt-3 text-sm text-white/85">
                Antecipe honorários advocatícios com a JusCash
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 px-4 py-8 sm:py-12 lg:gap-4 lg:py-4">
          <div className="flex flex-col items-center text-center lg:hidden">
            <Image
              src="/logo-responsive.svg"
              alt="JusCash"
              width={200}
              height={48}
              priority
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Antecipe honorários advocatícios com a JusCash
            </p>
          </div>

          <section className="w-full max-w-[460px] rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                Crie sua conta
              </h2>
              <p className="text-sm text-muted-foreground">
                Preencha os dados para começar
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-r-lg"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-r-lg"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-red-600">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-blue-900 text-white hover:bg-blue-950 focus-visible:ring-blue-900/40"
              >
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-900 hover:underline"
              >
                Entrar
              </Link>
            </p>
          </section>

          <p className="max-w-[460px] text-center text-xs text-muted-foreground">
            © 2026 · Juscash Administração de Pagamentos e Recebimentos SA
          </p>
        </div>
      </div>
    </main>
  );
}
