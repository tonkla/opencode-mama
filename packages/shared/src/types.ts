import type { FindingState, WorkflowState } from './enums'

export interface ActiveManagerSessionPointer {
	localSessionId: string
}

export interface ManagerPendingAction {
	type: string
	role: string
	handoff: string
	title: string
	createdAt: string
	requestedBy: string
}

export interface ManagerTaskPacket {
	id: string
	milestoneId: string
	role: string
	goal: string
	inputs: string[]
	constraints: string[]
	deliverables: string[]
	validationCommands: string[]
	findingIds: string[]
}

export interface ManagerFindingRef {
	id: string
	state: FindingState
}

export interface ManagerSessionState {
	id: string
	workflowState: WorkflowState
	objective: string
	activeRole: string | null
	activeMilestoneId: string | null
	activeTaskPacketPath: string | null
	findings: ManagerFindingRef[]
	pendingAction: ManagerPendingAction | null
}
