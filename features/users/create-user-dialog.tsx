"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createUserAccessAction } from "@/features/users/actions";
import { ROLE_LABELS, ROLES, type UserRole } from "@/lib/constants/roles";
import { createUserSchema, type CreateUserFormValues } from "@/lib/validators/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const defaultValues: CreateUserFormValues = {
  full_name: "",
  email: "",
  password: "",
  role: "visualizador",
  is_active: true,
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
  });

  const onSubmit = (values: CreateUserFormValues) => {
    startTransition(async () => {
      try {
        await createUserAccessAction(values);
        toast.success("Usuario criado com sucesso.");
        form.reset(defaultValues);
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel criar o usuario.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            Novo Usuario
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar Usuario</DialogTitle>
          <DialogDescription>
            Crie uma conta de acesso e defina o perfil inicial de permissao.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" placeholder="Ex.: Maria Silva" {...form.register("full_name")} />
              <p className="text-xs text-red-500">{form.formState.errors.full_name?.message}</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="maria@empresa.com"
                autoComplete="email"
                {...form.register("email")}
              />
              <p className="text-xs text-red-500">{form.formState.errors.email?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha provisoria</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimo 8 caracteres"
                {...form.register("password")}
              />
              <p className="text-xs text-red-500">{form.formState.errors.password?.message}</p>
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value) => form.setValue("role", value as UserRole, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Usuario ativo</p>
              <p className="text-xs text-slate-600">Quando inativo, o login e bloqueado.</p>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(checked) => form.setValue("is_active", checked, { shouldValidate: true })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuario"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
