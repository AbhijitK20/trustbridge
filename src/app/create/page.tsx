import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CreateDealForm from "./create-form";

type CreateSearchParams = {
  verificationId?: string;
  title?: string;
  description?: string;
  price?: string;
};

export default async function CreateDealPage({
  searchParams,
}: {
  searchParams: Promise<CreateSearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (!session?.user?.id) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    redirect(`/signin?next=${encodeURIComponent(`/create?${query.toString()}`)}`);
  }
  return (
    <CreateDealForm
      verificationId={params.verificationId}
      initialTitle={params.title}
      initialDescription={params.description}
      initialPrice={params.price}
    />
  );
}
