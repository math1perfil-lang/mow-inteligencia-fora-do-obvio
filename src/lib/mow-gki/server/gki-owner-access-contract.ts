/**
 * Synthetic policy labels for the future server-side GKI authorization adapter.
 * These are not database values and do not authenticate an actor or prove owner status.
 * This contract is intentionally not connected to any route, RPC, or operational handler.
 */
export type GkiOwnerAccessEvidence =
  "verified_active_owner" | "reviewer" | "inactive_owner" | "unverified";

/**
 * Allow only an explicitly verified active Factory owner.
 * The caller must eventually obtain this evidence from the trusted server-side Factory process.
 */
export function mayAccessGkiFromOwnerEvidence(evidence: unknown): boolean {
  return evidence === "verified_active_owner";
}
