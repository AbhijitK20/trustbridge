import { describe, expect, it } from "vitest";
import { mutationGuard, sameOrigin } from "@/lib/abuse";

describe("abuse protection", () => {
  it("accepts same-origin mutations", async () => {
    const request = new Request("http://localhost:3000/api/deals", { headers: { origin: "http://localhost:3000" } });
    expect(sameOrigin(request)).toBe(true);
  });

  it("rejects cross-origin mutations", async () => {
    const request = new Request("http://localhost:3000/api/deals", { headers: { origin: "https://attacker.example" } });
    expect((await mutationGuard(request, `cross-origin-${crypto.randomUUID()}`)).status).toBe(403);
  });

  it("limits repeated requests", async () => {
    const scope = `limit-${crypto.randomUUID()}`;
    const request = new Request("http://localhost:3000/api/deals");
    expect((await mutationGuard(request, scope, 2)).allowed).toBe(true);
    expect((await mutationGuard(request, scope, 2)).allowed).toBe(true);
    expect((await mutationGuard(request, scope, 2)).status).toBe(429);
  });
});
