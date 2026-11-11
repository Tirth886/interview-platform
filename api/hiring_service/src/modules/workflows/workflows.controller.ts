import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../middlewares/response';
import {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowIdParamsInput,
} from './workflows.schema';
import { workflowsService } from './workflows.service';

export class WorkflowsController {
  listWorkflows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await workflowsService.listWorkflows(req.auth!.companyId);
      sendSuccess(res, 'Workflows fetched', result);
    } catch (error) {
      next(error);
    }
  };

  getWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as WorkflowIdParamsInput;
      const result = await workflowsService.getWorkflow(req.auth!.companyId, params.workflowId);
      sendSuccess(res, 'Workflow fetched', result);
    } catch (error) {
      next(error);
    }
  };

  createWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateWorkflowInput;
      const result = await workflowsService.createWorkflow(req.auth!.companyId, body);
      sendSuccess(res, 'Workflow created', result, 201);
    } catch (error) {
      next(error);
    }
  };

  updateWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as WorkflowIdParamsInput;
      const body = req.body as UpdateWorkflowInput;
      const result = await workflowsService.updateWorkflow(
        req.auth!.companyId,
        params.workflowId,
        body
      );
      sendSuccess(res, 'Workflow updated', result);
    } catch (error) {
      next(error);
    }
  };

  deleteWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as WorkflowIdParamsInput;
      await workflowsService.deleteWorkflow(req.auth!.companyId, params.workflowId);
      sendSuccess(res, 'Workflow deleted', { ok: true });
    } catch (error) {
      next(error);
    }
  };
}

export const workflowsController = new WorkflowsController();
