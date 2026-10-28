import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CreateDealForm from "@/app/create/create-form";

type NewDealSearchParams = {
  verificationId?: string;
  title?: string;
  description?: string;
  price?: string;
};

export default async function DashboardNewDealPage({
  searchParams,
}: {
  searchParams: Promise<NewDealSearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/new");
  const params = await searchParams;

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Workspace · new deal</p>
          <h1>
            Put it <em>in writing.</em>
          </h1>
          <p>
            One agreement, one link. The money stays protected until the delivery is accepted.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/dashboard/deals">
            Back to deals <i>↗</i>
          </Link>
        </div>
      </header>

      <div className="ws-create-grid">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Agreement</small>
              <h2>Deal terms</h2>
            </div>
            <span className="ws-row-note">Created as awaiting payment</span>
          </div>
          <div className="ws-panel-body">
            <div className="ws-create">
              <CreateDealForm
                verificationId={params.verificationId}
                initialTitle={params.title}
                initialDescription={params.description}
                initialPrice={params.price}
              />
            </div>
          </div>
        </section>

        <aside className="ws-settings-stack">
          <section className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <small>After you create</small>
                <h2>What happens next</h2>
              </div>
            </div>
            <div className="ws-panel-body">
              <div className="ws-fact">
                <span>1 · Share</span>
                <strong>Send one link to the seller</strong>
              </div>
              <div className="ws-fact">
                <span>2 · Fund</span>
                <strong>You pay price + fee into protection</strong>
              </div>
              <div className="ws-fact">
                <span>3 · Deliver</span>
                <strong>Seller submits files and evidence</strong>
              </div>
              <div className="ws-fact">
                <span>4 · Release</span>
                <strong>You accept; money moves</strong>
              </div>
              <hr className="ws-divider" />
              <p className="ws-note">
                No payment is taken when the deal is created. It stays at AWAITING PAYMENT until you
                fund it.
              </p>
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <small>Money rule</small>
                <h2>What is protected</h2>
              </div>
              <Link href="/legal/refunds">Read</Link>
            </div>
            <div className="ws-panel-body">
              <div className="ws-fact">
                <span>Buyer pays</span>
                <strong>Seller price + protection fee</strong>
              </div>
              <div className="ws-fact">
                <span>Seller receives</span>
                <strong>The full seller price</strong>
              </div>
              <div className="ws-fact">
                <span>Fees</span>
                <strong>Never part of the protected balance</strong>
              </div>
              <div className="ws-fact">
                <span>Release</span>
                <strong>On delivery acceptance or milestone</strong>
              </div>
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <small>Optional</small>
                <h2>Attach a check</h2>
              </div>
              <Link href="/check">Run one</Link>
            </div>
            <div className="ws-panel-body">
              <p className="ws-split-note">
                If you already verified the offer, open the report and choose “Protect this deal”.
                The evidence travels with the agreement.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
