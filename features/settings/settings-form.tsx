"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/features/settings/actions";
import { settingsSchema, type SettingsFormValues } from "@/lib/validators/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsFormProps = {
  initialValues: SettingsFormValues;
  canWrite: boolean;
};

export function SettingsForm({ initialValues, canWrite }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
    values: initialValues,
  });

  const onSubmit = (values: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateSettingsAction(values);
        toast.success("Configurações atualizadas.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar configurações.");
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="company_name">Nome da empresa</Label>
        <Input id="company_name" disabled={!canWrite} {...form.register("company_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_logo_url">URL do logotipo</Label>
        <Input id="company_logo_url" disabled={!canWrite} {...form.register("company_logo_url")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default_currency">Moeda padrão</Label>
          <Input id="default_currency" disabled={!canWrite} {...form.register("default_currency")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Fuso horário</Label>
          <Input id="timezone" disabled={!canWrite} {...form.register("timezone")} />
        </div>
      </div>

      {canWrite ? (
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar configurações"
          )}
        </Button>
      ) : (
        <p className="text-sm text-rose-700">Seu perfil possui acesso somente leitura.</p>
      )}
    </form>
  );
}

