import type { TimelineItem } from "@/lib/timeline";

function formatTime(value: Date) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DealTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="deal-timeline">
      <p className="workflow-title">Deal record</p>
      <ol>
        {items.map((item) => (
          <li key={item.id} className={`timeline-item timeline-${item.tone}`}>
            <span className="timeline-dot" />
            <div>
              <div className="timeline-head">
                <strong>{item.title}</strong>
                <small>{formatTime(item.at)}</small>
              </div>
              {item.detail && <p>{item.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
