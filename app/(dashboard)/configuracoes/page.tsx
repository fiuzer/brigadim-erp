import { Building2, Cog, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { getSettingsData } from "@/features/settings/queries";
import { SettingsForm } from "@/features/settings/settings-form";
import { getProfileOrRedirect } from "@/features/auth/server";
import { hasPermission } from "@/lib/constants/roles";

export default async function ConfiguracoesPage() {
  const [{ profile }, settings] = await Promise.all([getProfileOrRedirect(), getSettingsData()]);
  const canWrite = hasPermission(profile.role, "settings:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Defina parâmetros gerais da operação e controle administrativo."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Empresa" value={settings.company_name} subtitle="Identificação principal" icon={Building2} />
        <KpiCard title="Moeda" value={settings.default_currency} subtitle="Padrão de cálculo financeiro" icon={Cog} />
        <KpiCard title="Perfil Atual" value={profile.role} subtitle={canWrite ? "Pode editar" : "Somente leitura"} icon={Shield} />
      </section>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Parâmetros da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            canWrite={canWrite}
            initialValues={{
              company_name: settings.company_name,
              company_logo_url: settings.company_logo_url ?? "",
              default_currency: settings.default_currency,
              timezone: settings.timezone,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
