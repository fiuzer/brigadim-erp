"use client";

import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateUserDialog } from "@/features/users/create-user-dialog";
import { updateUserAccessAction } from "@/features/users/actions";
import { ROLE_LABELS, ROLES, type UserRole } from "@/lib/constants/roles";
import { formatDateBR } from "@/lib/utils/format";

export type UserRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export function UsersTable({ users }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition();

  const updateUser = (row: UserRow, patch: Partial<Pick<UserRow, "role" | "is_active">>) => {
    startTransition(async () => {
      try {
        await updateUserAccessAction({
          id: row.id,
          role: patch.role ?? row.role,
          is_active: patch.is_active ?? row.is_active,
        });
        toast.success("Usuario atualizado com sucesso.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar usuario.");
      }
    });
  };

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "full_name",
      header: "Nome",
      cell: ({ row }) => row.original.full_name ?? "Sem nome",
    },
    {
      accessorKey: "role",
      header: "Perfil",
      cell: ({ row }) => (
        <Select
          value={row.original.role}
          onValueChange={(value) => updateUser(row.original, { role: value as UserRole })}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.is_active}
            disabled={isPending}
            onCheckedChange={(checked) => updateUser(row.original, { is_active: checked })}
          />
          <Badge className={row.original.is_active ? "bg-emerald-100 text-emerald-700" : ""}>
            {row.original.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Cadastro",
      cell: ({ row }) => formatDateBR(row.original.created_at),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      searchAccessor={(row) => `${row.full_name ?? ""} ${ROLE_LABELS[row.role]}`}
      searchPlaceholder="Buscar usuario..."
      rightAction={<CreateUserDialog />}
    />
  );
}
