import { ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { getUsersPageData } from "@/features/users/queries";
import { UsersTable } from "@/features/users/users-table";

export default async function UsuariosPage() {
  const users = await getUsersPageData();
  const active = users.filter((user) => user.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie perfis, permissões e status de acesso à plataforma."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <KpiCard title="Usuários Ativos" value={String(active)} subtitle="Com acesso liberado" icon={Users} />
        <KpiCard title="Total de Perfis" value={String(users.length)} subtitle="Contas registradas" icon={ShieldCheck} />
      </section>

      <UsersTable users={users} />
    </div>
  );
}
