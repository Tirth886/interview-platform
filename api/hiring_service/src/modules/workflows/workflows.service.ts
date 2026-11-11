import crypto from 'crypto';
import { PoolClient } from 'pg';
import { NotFoundError, ValidationError } from '../../middlewares/errors';
import { withTransaction } from '../../providers/database';
import { stagesRepository } from '../stages/stages.repository';
import { CreateWorkflowInput, UpdateWorkflowInput } from './workflows.schema';
import {
  WorkflowEdgeInsert,
  WorkflowEdgeRow,
  WorkflowNodeInsert,
  WorkflowNodeRow,
  WorkflowRow,
  workflowsRepository,
} from './workflows.repository';

export type WorkflowStageDto = {
  id: string;
  stageId: string;
  name: string;
  code: string;
  conductor: 'ai' | 'human' | 'qa';
  aiAgentId?: string;
  qaBankId?: string;
  nodeId?: string;
  orderIndex: number;
  isEnabled: boolean;
  config: Record<string, unknown>;
};

export type WorkflowDto = {
  id: string;
  name: string;
  designationId: string;
  stages: WorkflowStageDto[];
  nodes: unknown[];
  edges: unknown[];
  jobDescriptionFileName: string;
  jobDescriptionUrl: string;
  jobDescriptionKey: string;
  createdAt: string;
  updatedAt: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const slugifyCode = (value: string, fallback = 'stage'): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return slug || fallback;
};

const uniqueCode = (base: string, used: Set<string>): string => {
  let candidate = base || 'stage';
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
};

const minimalStageConfig = (config: Record<string, unknown>): Record<string, unknown> => {
  const next: Record<string, unknown> = {};
  if (typeof config.assigneeEmail === 'string' && config.assigneeEmail.trim()) {
    next.assigneeEmail = config.assigneeEmail.trim().toLowerCase();
  }
  if (config.passRule && typeof config.passRule === 'object') {
    next.passRule = config.passRule;
  }
  if (typeof config.description === 'string' && config.description.trim()) {
    next.description = config.description.trim().slice(0, 5000);
  }
  if (
    typeof config.durationMinutes === 'number' &&
    Number.isFinite(config.durationMinutes) &&
    config.durationMinutes >= 15
  ) {
    next.durationMinutes = Math.min(360, Math.round(config.durationMinutes));
  }
  return next;
};

/** Default canvas: Start and End independent (user draws connections) */
const createDefaultWorkflowGraph = async (
  _client?: PoolClient
): Promise<{ nodes: unknown[]; edges: unknown[] }> => {
  const startId = crypto.randomUUID();
  const endId = crypto.randomUUID();

  return {
    nodes: [
      {
        id: startId,
        type: 'start',
        position: { x: 160, y: 200 },
        style: { width: 48, height: 48 },
        data: { kind: 'start', label: 'Start', disconnected: true },
      },
      {
        id: endId,
        type: 'end',
        position: { x: 480, y: 200 },
        style: { width: 48, height: 48 },
        data: { kind: 'end', label: 'End' },
      },
    ],
    edges: [],
  };
};

const nodeRowToFlow = (row: WorkflowNodeRow): Record<string, unknown> => {
  const config = row.config ?? {};
  const style: Record<string, number> = {};
  if (typeof row.width === 'number') style.width = row.width;
  if (typeof row.height === 'number') style.height = row.height;

  const data: Record<string, unknown> = {
    ...config,
    kind: row.kind,
    label: row.label,
  };

  if (row.stage_definition_id) {
    data.stageDefinitionId = row.stage_definition_id;
  }
  if (row.ai_agent_id) {
    data.aiAgentId = row.ai_agent_id;
  }
  if (row.qa_bank_id) {
    data.qaBankId = row.qa_bank_id;
  }
  if (row.code) {
    data.stageCode = row.code;
  }
  if (row.kind === 'stage' || row.kind === 'atsCheck') {
    data.stageType =
      row.conductor === 'human' ? 'human' : row.conductor === 'qa' ? 'qa' : 'ai';
  }

  return {
    id: row.id,
    type: row.kind,
    position: { x: row.position_x, y: row.position_y },
    ...(Object.keys(style).length > 0 ? { style } : {}),
    data,
  };
};

const edgeRowToFlow = (row: WorkflowEdgeRow): Record<string, unknown> => ({
  id: row.id,
  source: row.source_node_id,
  target: row.target_node_id,
  sourceHandle: row.source_handle,
  targetHandle: row.target_handle,
});

const parseFlowNodes = async (
  nodes: unknown[],
  client?: PoolClient
): Promise<WorkflowNodeInsert[]> => {
  const result: WorkflowNodeInsert[] = [];
  let orderIndex = 0;
  const usedCodes = new Set<string>();
  const ats = await stagesRepository.findByCode('ats', client);

  for (const raw of nodes) {
    const node = asRecord(raw);
    const id = typeof node.id === 'string' ? node.id : null;
    if (!id || !UUID_RE.test(id)) continue;

    const data = asRecord(node.data);
    const position = asRecord(node.position);
    const style = asRecord(node.style);

    const kind =
      (typeof data.kind === 'string' && data.kind) ||
      (typeof node.type === 'string' && node.type) ||
      'stage';

    let stageDefinitionId =
      typeof data.stageDefinitionId === 'string' && UUID_RE.test(data.stageDefinitionId)
        ? data.stageDefinitionId
        : typeof data.stageId === 'string' && UUID_RE.test(data.stageId)
          ? data.stageId
          : null;

    if (!stageDefinitionId && kind === 'atsCheck' && ats?.id) {
      stageDefinitionId = ats.id;
    }

    const conductor: 'ai' | 'human' | 'qa' =
      data.stageType === 'human' || data.conductor === 'human'
        ? 'human'
        : data.stageType === 'qa' || data.conductor === 'qa'
          ? 'qa'
          : 'ai';

    const aiAgentId =
      conductor === 'ai' && typeof data.aiAgentId === 'string' && UUID_RE.test(data.aiAgentId)
        ? data.aiAgentId
        : null;

    const qaBankId =
      conductor === 'qa' && typeof data.qaBankId === 'string' && UUID_RE.test(data.qaBankId)
        ? data.qaBankId
        : null;

    const label = typeof data.label === 'string' ? data.label : kind;
    let code = '';
    if (kind === 'stage' || kind === 'atsCheck') {
      const requested =
        typeof data.stageCode === 'string' && data.stageCode.trim()
          ? slugifyCode(data.stageCode)
          : slugifyCode(label, kind === 'atsCheck' ? 'ats' : 'stage');
      code = uniqueCode(requested, usedCodes);
    }

    const {
      kind: _kind,
      label: _label,
      stageDefinitionId: _sd,
      stageId: _sid,
      aiAgentId: _aid,
      qaBankId: _qid,
      stageCode: _code,
      stageType: _stype,
      conductor: _cond,
      ...restConfig
    } = data;

    result.push({
      id,
      kind,
      label,
      stageDefinitionId,
      aiAgentId,
      qaBankId,
      code,
      conductor,
      isEnabled: true,
      positionX: asNumber(position.x),
      positionY: asNumber(position.y),
      width: typeof style.width === 'number' ? style.width : null,
      height: typeof style.height === 'number' ? style.height : null,
      config: minimalStageConfig(restConfig),
      orderIndex,
    });
    orderIndex += 1;
  }

  return result;
};

const parseFlowEdges = (edges: unknown[]): WorkflowEdgeInsert[] => {
  const result: WorkflowEdgeInsert[] = [];

  for (const raw of edges) {
    const edge = asRecord(raw);
    const rawId = typeof edge.id === 'string' ? edge.id : null;
    const source = typeof edge.source === 'string' ? edge.source : null;
    const target = typeof edge.target === 'string' ? edge.target : null;
    if (!source || !target) continue;
    if (!UUID_RE.test(source) || !UUID_RE.test(target)) continue;

    const id = rawId && UUID_RE.test(rawId) ? rawId : crypto.randomUUID();

    result.push({
      id,
      sourceNodeId: source,
      targetNodeId: target,
      sourceHandle: typeof edge.sourceHandle === 'string' ? edge.sourceHandle : null,
      targetHandle: typeof edge.targetHandle === 'string' ? edge.targetHandle : null,
    });
  }

  return result;
};

const stagesFromNodes = (nodeRows: WorkflowNodeRow[]): WorkflowStageDto[] =>
  nodeRows
    .filter((node) => node.kind === 'stage' || node.kind === 'atsCheck')
    .filter((node) => Boolean(node.stage_definition_id))
    .map((node) => ({
      id: node.id,
      stageId: node.stage_definition_id as string,
      name: node.label,
      code: node.code,
      conductor:
        node.conductor === 'human'
          ? ('human' as const)
          : node.conductor === 'qa'
            ? ('qa' as const)
            : ('ai' as const),
      ...(node.ai_agent_id ? { aiAgentId: node.ai_agent_id } : {}),
      ...(node.qa_bank_id ? { qaBankId: node.qa_bank_id } : {}),
      nodeId: node.id,
      orderIndex: node.order_index,
      isEnabled: node.is_enabled,
      config: node.config ?? {},
    }));

const mapWorkflow = (
  row: WorkflowRow,
  nodeRows: WorkflowNodeRow[],
  edgeRows: WorkflowEdgeRow[]
): WorkflowDto => ({
  id: row.id,
  name: row.name,
  designationId: row.designation_id,
  stages: stagesFromNodes(nodeRows),
  nodes: nodeRows.map(nodeRowToFlow),
  edges: edgeRows.map(edgeRowToFlow),
  jobDescriptionFileName: row.job_description_file_name,
  jobDescriptionUrl: row.job_description_url,
  jobDescriptionKey: row.job_description_key,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const loadMappedWorkflow = async (
  companyId: string,
  row: WorkflowRow,
  client?: PoolClient
): Promise<WorkflowDto> => {
  const [nodes, edges] = await Promise.all([
    workflowsRepository.listNodes(companyId, row.id, client),
    workflowsRepository.listEdges(companyId, row.id, client),
  ]);
  return mapWorkflow(row, nodes, edges);
};

export class WorkflowsService {
  async listWorkflows(companyId: string): Promise<{ items: WorkflowDto[] }> {
    const rows = await workflowsRepository.list(companyId);
    const items = await Promise.all(rows.map((row) => loadMappedWorkflow(companyId, row)));
    return { items };
  }

  async getWorkflow(companyId: string, workflowId: string): Promise<{ workflow: WorkflowDto }> {
    const row = await workflowsRepository.findById(companyId, workflowId);
    if (!row) throw new NotFoundError('Workflow not found');
    return { workflow: await loadMappedWorkflow(companyId, row) };
  }

  async createWorkflow(
    companyId: string,
    payload: CreateWorkflowInput
  ): Promise<{ workflow: WorkflowDto }> {
    const created = await withTransaction(async (client) => {
      const graph = await createDefaultWorkflowGraph(client);
      const flowNodes = payload.nodes ?? graph.nodes;
      const flowEdges = payload.edges ?? graph.edges;
      const nodes = await parseFlowNodes(flowNodes as unknown[], client);
      const edges = parseFlowEdges(flowEdges as unknown[]);

      const row = await workflowsRepository.create(
        {
          companyId,
          name: payload.name.trim(),
          designationId: payload.designationId ?? '',
          jobDescriptionFileName: payload.jobDescriptionFileName,
          jobDescriptionUrl: payload.jobDescriptionUrl,
          jobDescriptionKey: payload.jobDescriptionKey,
        },
        client
      );

      await workflowsRepository.replaceGraph(companyId, row.id, nodes, edges, client);
      return loadMappedWorkflow(companyId, row, client);
    });

    return { workflow: created };
  }

  async updateWorkflow(
    companyId: string,
    workflowId: string,
    payload: UpdateWorkflowInput
  ): Promise<{ workflow: WorkflowDto }> {
    const existing = await workflowsRepository.findById(companyId, workflowId);
    if (!existing) throw new NotFoundError('Workflow not found');

    if (payload.name !== undefined && !payload.name.trim()) {
      throw new ValidationError('Workflow name is required.');
    }

    const updated = await withTransaction(async (client) => {
      const row = await workflowsRepository.update(
        companyId,
        workflowId,
        {
          name: payload.name?.trim(),
          designationId: payload.designationId,
          jobDescriptionFileName: payload.jobDescriptionFileName,
          jobDescriptionUrl: payload.jobDescriptionUrl,
          jobDescriptionKey: payload.jobDescriptionKey,
        },
        client
      );

      if (!row) throw new NotFoundError('Workflow not found');

      if (payload.nodes !== undefined && payload.edges !== undefined) {
        const nodes = await parseFlowNodes(payload.nodes as unknown[], client);
        const edges = parseFlowEdges(payload.edges as unknown[]);
        await workflowsRepository.replaceGraph(companyId, workflowId, nodes, edges, client);
      }

      return loadMappedWorkflow(companyId, row, client);
    });

    return { workflow: updated };
  }

  async deleteWorkflow(companyId: string, workflowId: string): Promise<void> {
    const deleted = await workflowsRepository.delete(companyId, workflowId);
    if (!deleted) {
      throw new NotFoundError('Workflow not found');
    }
  }
}

export const workflowsService = new WorkflowsService();
