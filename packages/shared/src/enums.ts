export const WorkflowStates = {
	New: 'new',
	Routing: 'routing',
	WorkerRunning: 'worker_running',
	NeedsClarification: 'needs_clarification',
	Reviewing: 'reviewing',
	Completed: 'completed',
	Failed: 'failed',
	Cancelled: 'cancelled',
} as const

export type WorkflowState = (typeof WorkflowStates)[keyof typeof WorkflowStates]

export const FindingStates = {
	Open: 'open',
	FixedPendingReview: 'fixed_pending_review',
	Closed: 'closed',
	Deferred: 'deferred',
	Reopened: 'reopened',
} as const

export type FindingState = (typeof FindingStates)[keyof typeof FindingStates]
