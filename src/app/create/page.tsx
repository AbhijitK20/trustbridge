import Link from "next/link";
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
    const next = query.toString() ? `/create?${query.toString()}` : "/create";
    redirect(`/signin?next=${encodeURIComponent(next)}`);
  }
  return (
    <main className="form-page">
      <div className="form-intro">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <p className="eyebrow">Start a protected deal</p>
        <h1>
          Put the agreement
          <br />
          <em>in writing.</em>
        </h1>
        <p>One link. Clear deliverables. Payment protected until the work is delivered.</p>
      </div>
      <CreateDealForm
        verificationId={params.verificationId}
        initialTitle={params.title}
        initialDescription={params.description}
        initialPrice={params.price}
      />
    </main>
  );
}
