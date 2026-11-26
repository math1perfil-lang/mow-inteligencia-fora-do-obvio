import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const candidateSql = readFileSync(
  resolve(process.cwd(), "supabase/candidates/20261125_client_solution_workspace.candidate.sql"),
  "utf8",
);

describe("client solution SQL policy candidate", () => {
  it("binds invite acceptance to the authenticated account and its confirmed email", () => {
    expect(candidateSql).toContain("v_actor uuid := auth.uid();");
    expect(candidateSql).toContain("v_invite.invited_email IS DISTINCT FROM v_email");
    expect(candidateSql).toContain("v_confirmed_at IS NULL");
  });

  it("lists solutions and progress only for the authenticated active membership", () => {
    expect(candidateSql).toMatch(
      /WHERE m\.user_id = auth\.uid\(\) AND m\.revoked_at IS NULL AND r\.revoked_at IS NULL/,
    );
    expect(candidateSql).toMatch(
      /m\.release_id = p_release_id AND m\.user_id = auth\.uid\(\)[\s\S]*?m\.revoked_at IS NULL AND r\.revoked_at IS NULL/,
    );
    expect(candidateSql).toMatch(/m\.user_id = v_actor AND m\.revoked_at IS NULL/);
  });

  it("keeps direct table access revoked and exposes only narrow authenticated RPCs", () => {
    expect(candidateSql).toMatch(
      /REVOKE ALL ON TABLE method_factory\.client_solution_releases,[\s\S]*?FROM PUBLIC, anon, authenticated, service_role;/,
    );
    expect(candidateSql).toContain(
      "GRANT EXECUTE ON FUNCTION public.mow_factory_list_client_solutions_v1()",
    );
    expect(candidateSql).toContain(
      "GRANT EXECUTE ON FUNCTION public.mow_factory_update_client_solution_progress_v1(uuid,text,text,text)",
    );
  });
});
