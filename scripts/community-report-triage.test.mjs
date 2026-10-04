import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCommunityReportTriage } from './community-report-triage.mjs';

const syntheticReports = [
  { id: 'r-unsafe', commentId: 'comment-a', reason: 'potentially_unsafe', status: 'pending' },
  { id: 'r-spam-same', commentId: 'comment-a', reason: 'spam', status: 'pending' },
  { id: 'r-harassment', commentId: 'comment-b', reason: 'harassment', status: 'pending' },
  { id: 'r-spam', commentId: 'comment-c', reason: 'spam', status: 'pending' },
  { id: 'r-resolved', commentId: 'comment-d', reason: 'misleading', status: 'actioned' },
];

test('groups pending reports and escalates safety or owner decisions without automatic action', () => {
  const plan = buildCommunityReportTriage(syntheticReports);

  assert.deepEqual(plan.summary, { pendingCaseCount: 3, escalationCount: 2, routineCount: 1 });
  assert.equal(plan.cases.find((item) => item.internalCommentId === 'comment-a')?.queue, 'professional_review');
  assert.equal(plan.cases.find((item) => item.internalCommentId === 'comment-b')?.queue, 'owner_decision');
  assert.equal(plan.cases.find((item) => item.internalCommentId === 'comment-c')?.queue, 'routine');
  assert.ok(plan.cases.every((item) => item.assignedTriageOwner === 'jarvis'));
  assert.ok(plan.cases.every((item) => item.automaticModerationAction === 'none'));
  assert.ok(plan.cases.every((item) => item.clinicalApproval === 'not_granted'));
  assert.ok(plan.cases.every((item) => item.responseDeadline === 'unassigned'));
});

test('owner-chat alert envelopes exclude content, reporter identity and raw comment identifiers', () => {
  const first = buildCommunityReportTriage(syntheticReports);
  const second = buildCommunityReportTriage(syntheticReports);
  const serialized = JSON.stringify(first.alerts);

  assert.deepEqual(first.alerts, second.alerts);
  assert.ok(first.alerts.every((alert) => alert.target === 'owner_chat'));
  assert.ok(first.alerts.every((alert) => alert.deliveryStatus === 'not_configured'));
  assert.doesNotMatch(serialized, /comment-a|comment-b|reporter|content/i);
});

test('resolved reports are excluded and unsupported values fail closed', () => {
  const plan = buildCommunityReportTriage([
    { id: 'r-dismissed', commentId: 'comment-a', reason: 'spam', status: 'dismissed' },
  ]);
  assert.deepEqual(plan.summary, { pendingCaseCount: 0, escalationCount: 0, routineCount: 0 });

  assert.throws(
    () => buildCommunityReportTriage([{ id: 'r-bad', commentId: 'comment-a', reason: 'approve', status: 'pending' }]),
    /unsupported report reason/,
  );
  assert.throws(
    () => buildCommunityReportTriage([{ id: 'r-inherited', commentId: 'comment-a', reason: 'toString', status: 'pending' }]),
    /unsupported report reason/,
  );
});
