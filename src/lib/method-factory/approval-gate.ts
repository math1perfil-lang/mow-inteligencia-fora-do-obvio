export const METHOD_APPROVAL_BACKEND_READY = false as const;

export const METHOD_APPROVAL_BACKEND_BLOCKERS = [
  "authoritative_package_digest",
  "active_review_policy_source",
  "integral_review_persistence_and_coverage",
  "downstream_association_and_approval_validation",
] as const;

/**
 * Fail closed until the database and application validate the complete persisted review gate.
 * Keep METHOD_APPROVAL_BACKEND_READY false until every blocker is implemented and verified.
 */
export async function executeMethodApprovalIfReady(
  invokeApproval: () => Promise<boolean>,
): Promise<boolean> {
  if (!METHOD_APPROVAL_BACKEND_READY) return false;
  return invokeApproval();
}
