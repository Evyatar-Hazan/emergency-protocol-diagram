import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const reasonPolicy = Object.freeze({
  potentially_unsafe: { queue: 'professional_review', priority: 0 },
  misleading: { queue: 'professional_review', priority: 0 },
  harassment: { queue: 'owner_decision', priority: 1 },
  other_policy: { queue: 'owner_decision', priority: 1 },
  spam: { queue: 'routine', priority: 2 },
});

const reportStatuses = new Set(['pending', 'dismissed', 'actioned']);

function caseIdFor(commentId) {
  return `community-case-${createHash('sha256').update(`comment:${commentId}`).digest('hex').slice(0, 16)}`;
}

function validateReport(report) {
  if (!report || typeof report !== 'object') throw new TypeError('report must be an object');
  if (typeof report.id !== 'string' || !report.id.trim()) throw new TypeError('report.id is required');
  if (typeof report.commentId !== 'string' || !report.commentId.trim()) {
    throw new TypeError('report.commentId is required');
  }
  if (typeof report.reason !== 'string' || !Object.hasOwn(reasonPolicy, report.reason)) {
    throw new TypeError(`unsupported report reason: ${report.reason}`);
  }
  if (!reportStatuses.has(report.status)) throw new TypeError(`unsupported report status: ${report.status}`);
}

export function buildCommunityReportTriage(reports) {
  if (!Array.isArray(reports)) throw new TypeError('reports must be an array');

  const grouped = new Map();
  for (const report of reports) {
    validateReport(report);
    if (report.status !== 'pending') continue;

    const current = grouped.get(report.commentId) ?? {
      commentId: report.commentId,
      reportIds: [],
      reasons: new Set(),
      queue: 'routine',
      priority: Number.POSITIVE_INFINITY,
    };
    const policy = reasonPolicy[report.reason];
    current.reportIds.push(report.id);
    current.reasons.add(report.reason);
    if (policy.priority < current.priority) {
      current.queue = policy.queue;
      current.priority = policy.priority;
    }
    grouped.set(report.commentId, current);
  }

  const cases = [...grouped.values()]
    .map((item) => ({
      caseId: caseIdFor(item.commentId),
      internalCommentId: item.commentId,
      reportIds: [...item.reportIds].sort(),
      reasonCodes: [...item.reasons].sort(),
      reportCount: item.reportIds.length,
      queue: item.queue,
      assignedTriageOwner: 'jarvis',
      decisionOwner:
        item.queue === 'professional_review'
          ? 'qualified_professional_or_human_owner'
          : item.queue === 'owner_decision'
            ? 'human_owner'
            : 'jarvis_triage',
      automaticModerationAction: 'none',
      clinicalApproval: 'not_granted',
      responseDeadline: 'unassigned',
    }))
    .sort((left, right) => left.caseId.localeCompare(right.caseId));

  const alerts = cases
    .filter((item) => item.queue !== 'routine')
    .map((item) => ({
      caseId: item.caseId,
      target: 'owner_chat',
      deliveryStatus: 'not_configured',
      escalationType: item.queue,
      reasonCodes: item.reasonCodes,
      reportCount: item.reportCount,
      requiresHumanDecision: true,
      clinicalApproval: 'not_granted',
      responseDeadline: 'unassigned',
    }));

  return {
    cases,
    alerts,
    summary: {
      pendingCaseCount: cases.length,
      escalationCount: alerts.length,
      routineCount: cases.filter((item) => item.queue === 'routine').length,
    },
  };
}

function publicOutput(plan) {
  return { alerts: plan.alerts, summary: plan.summary };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error('usage: node scripts/community-report-triage.mjs <synthetic-reports.json>');
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  process.stdout.write(`${JSON.stringify(publicOutput(buildCommunityReportTriage(input.reports)), null, 2)}\n`);
}
