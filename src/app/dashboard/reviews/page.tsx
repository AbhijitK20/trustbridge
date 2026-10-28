import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function Stars({ score }: { score: number }) {
  return (
    <span className="ws-stars" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < score ? "is-on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function DashboardReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/reviews");

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const ratings = await prisma.rating.findMany({
    where: {
      OR: [
        { reviewerId: session.user.id },
        ...(seller ? [{ sellerId: seller.id }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      deal: { select: { title: true, publicToken: true } },
      reviewer: { select: { name: true, email: true } },
      seller: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  const received = seller ? ratings.filter((rating) => rating.sellerId === seller.id) : [];
  const written = ratings.filter((rating) => rating.reviewerId === session.user.id);
  const average =
    received.length > 0
      ? (received.reduce((sum, rating) => sum + rating.score, 0) / received.length).toFixed(1)
      : "—";

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Workspace · reviews</p>
          <h1>
            What the work <em>earned.</em>
          </h1>
          <p>
            Reviews attach to a closed deal, never to a promise. A score is one signal inside the
            public trust record — not a substitute for evidence.
          </p>
        </div>
        <div className="ws-head-actions">
          {seller && (
            <Link className="ws-btn ws-btn-ghost" href="/dashboard/profile">
              Public profile <i>↗</i>
            </Link>
          )}
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Average received</span>
          <span className="ws-kpi-value">
            {average}
            <small>/ 5</small>
          </span>
          <span className="ws-kpi-note">From closed deals only</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Reviews received</span>
          <span className="ws-kpi-value">{received.length}</span>
          <span className="ws-kpi-note">Buyers you have delivered for</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Reviews written</span>
          <span className="ws-kpi-value">{written.length}</span>
          <span className="ws-kpi-note">Sellers you have worked with</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Rule</span>
          <span className="ws-kpi-value" style={{ fontSize: 19 }}>
            One per deal
          </span>
          <span className="ws-kpi-note">No review without a closed record</span>
        </div>
      </section>

      <div className="ws-grid-2">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Received</small>
              <h2>What buyers said</h2>
            </div>
            <span className="ws-row-note">{received.length} reviews</span>
          </div>
          <div className="ws-panel-body ws-panel-body-flush">
            {received.length === 0 ? (
              <p className="ws-empty">
                {seller
                  ? "No reviews yet. They appear after your first delivery is accepted."
                  : "Reviews appear once you have a verified seller profile and a closed deal."}
              </p>
            ) : (
              received.map((rating) => (
                <article className="ws-review" key={rating.id}>
                  <div className="ws-review-top">
                    <Stars score={rating.score} />
                    <span className="ws-row-note">
                      {rating.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="ws-review-quote">
                    {rating.comment ?? "No written comment."}
                  </p>
                  <div className="ws-review-foot">
                    <span>
                      {rating.reviewer.name ?? rating.reviewer.email} ·{" "}
                      <Link className="ws-inline-link" href={`/deal/${rating.deal.publicToken}`}>
                        {rating.deal.title}
                      </Link>
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Written</small>
              <h2>What you said</h2>
            </div>
            <Link href="/dashboard/deals">All deals</Link>
          </div>
          <div className="ws-panel-body ws-panel-body-flush">
            {written.length === 0 ? (
              <p className="ws-empty">You have not reviewed a seller yet.</p>
            ) : (
              written.map((rating) => (
                <article className="ws-review" key={rating.id}>
                  <div className="ws-review-top">
                    <Stars score={rating.score} />
                    <span className="ws-row-note">
                      {rating.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="ws-review-quote">{rating.comment ?? "No written comment."}</p>
                  <div className="ws-review-foot">
                    <span>
                      For {rating.seller.user.name ?? rating.seller.user.email} ·{" "}
                      <Link className="ws-inline-link" href={`/deal/${rating.deal.publicToken}`}>
                        {rating.deal.title}
                      </Link>
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Trust record</small>
            <h2>How a review is used</h2>
          </div>
          <Link href="/check">Verification</Link>
        </div>
        <div className="ws-panel-body">
          <div className="ws-grid-3" style={{ marginTop: 0 }}>
            <div>
              <span className="ws-kpi-label">Evidence first</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                A review never overrides the signed scope or the verification outcome.
              </p>
            </div>
            <div>
              <span className="ws-kpi-label">One per deal</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                Reviews cannot be edited after they are written, and cannot be bought.
              </p>
            </div>
            <div>
              <span className="ws-kpi-label">Public record</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                Scores appear on the seller profile alongside completed deals and reports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
