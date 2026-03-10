import { Candy } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="relative z-10 w-full max-w-md border-[#907761]/60 bg-[#2B1E17]/85 text-[#fffaf8] shadow-2xl backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#907761] to-[#B96A75] text-[#fffaf8]">
          <Candy className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Bem-vindo ao Brigadim</CardTitle>
          <CardDescription className="text-[#d7c5b9]">
            Acesse sua conta para gerenciar produtos, estoque, vendas e finanças.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
