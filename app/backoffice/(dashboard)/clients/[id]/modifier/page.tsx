import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import ClientForm from "@/components/ClientForm";
import { modifierClient } from "@/lib/actions/clients";

export const metadata = { title: "Modifier client" };

export default async function ModifierClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const action = modifierClient.bind(null, id);

  return (
    <>
      <Header title={`Modifier — ${client.nom}`} />
      <ClientForm client={client} action={action} />
    </>
  );
}
