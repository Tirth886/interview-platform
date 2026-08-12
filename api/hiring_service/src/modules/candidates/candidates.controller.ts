import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../middlewares/response';
import { CandidatesService, candidatesService } from './candidates.service';
import {
  AddCandidateNoteInput,
  CandidateIdParamsInput,
  CandidateImportInput,
  CreateCandidateInput,
  ListCandidatesQueryInput,
  UpdateCandidateStatusInput,
} from './candidates.schema';

export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * @openapi
   * /api/v1/candidates:
   *   get:
   *     tags: [Candidates]
   *     summary: Get paginated candidates list
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, minimum: 1, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [pending, active, hold, rejected, selected] }
   *       - in: query
   *         name: atsResult
   *         schema: { type: string, enum: [pass, fail] }
   *       - in: query
   *         name: sortBy
   *         schema: { type: string, enum: [appliedAt, updatedAt, name, status], default: appliedAt }
   *       - in: query
   *         name: sortOrder
   *         schema: { type: string, enum: [asc, desc], default: desc }
   *     responses:
   *       200: { description: Candidates fetched with pagination metadata }
   *       401: { description: Unauthorized }
   */
  listCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = req.auth;
      const query = req.query as unknown as ListCandidatesQueryInput;
      const result = await this.candidatesService.listCandidates(auth!.companyId, query);
      sendSuccess(res, 'Candidates fetched', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/candidates:
   *   post:
   *     tags: [Candidates]
   *     summary: Create a basic candidate profile
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [phoneNumber]
   *             properties:
   *               phoneNumber: { type: string }
   *               name: { type: string }
   *               email: { type: string, format: email }
   *               resumeUrl: { type: string }
   *               experienceSummary: { type: string }
   *               profileKeywords:
   *                 type: array
   *                 items: { type: string }
   *     responses:
   *       201: { description: Candidate created }
   *       401: { description: Unauthorized }
   */
  createCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = req.auth;
      const body = req.body as CreateCandidateInput;
      const result = await this.candidatesService.createCandidate(auth!.companyId, body);
      sendSuccess(res, 'Candidate created', result, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/candidates/{candidateId}:
   *   get:
   *     tags: [Candidates]
   *     summary: Get candidate details by id
   *     parameters:
   *       - in: path
   *         name: candidateId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Candidate fetched }
   *       401: { description: Unauthorized }
   *       404: { description: Candidate not found }
   */
  getCandidateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = req.auth;
      const params = req.params as unknown as CandidateIdParamsInput;
      const candidate = await this.candidatesService.getCandidateById(
        auth!.companyId,
        params.candidateId
      );
      sendSuccess(res, 'Candidate fetched', { candidate });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/candidates/{candidateId}/status:
   *   patch:
   *     tags: [Candidates]
   *     summary: Update candidate status
   *     parameters:
   *       - in: path
   *         name: candidateId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, active, hold, rejected, selected]
   *               detail:
   *                 type: string
   *     responses:
   *       200: { description: Candidate status updated }
   *       401: { description: Unauthorized }
   *       404: { description: Candidate not found }
   */
  updateCandidateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const auth = req.auth;
      const params = req.params as unknown as CandidateIdParamsInput;
      const body = req.body as UpdateCandidateStatusInput;
      const candidate = await this.candidatesService.updateCandidateStatus(
        auth!.companyId,
        params.candidateId,
        body
      );
      sendSuccess(res, 'Candidate status updated', { candidate });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/candidates/{candidateId}/notes:
   *   post:
   *     tags: [Candidates]
   *     summary: Add a candidate note
   *     parameters:
   *       - in: path
   *         name: candidateId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [text]
   *             properties:
   *               text: { type: string }
   *               author: { type: string }
   *     responses:
   *       200: { description: Note added }
   *       401: { description: Unauthorized }
   *       404: { description: Candidate not found }
   */
  addCandidateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = req.auth;
      const params = req.params as unknown as CandidateIdParamsInput;
      const body = req.body as AddCandidateNoteInput;
      const result = await this.candidatesService.addCandidateNote(
        auth!.companyId,
        params.candidateId,
        body
      );
      sendSuccess(res, 'Candidate note added', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/candidates/{candidateId}/run-automation:
   *   post:
   *     tags: [Candidates]
   *     summary: Execute candidate automation rules
   *     parameters:
   *       - in: path
   *         name: candidateId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Automation executed }
   *       401: { description: Unauthorized }
   *       404: { description: Candidate not found }
   */
  runCandidateAutomation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const auth = req.auth;
      const params = req.params as unknown as CandidateIdParamsInput;
      const result = await this.candidatesService.runCandidateAutomation(
        auth!.companyId,
        params.candidateId
      );
      sendSuccess(res, 'Candidate automation executed', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/candidates/import:
   *   post:
   *     tags: [Candidates]
   *     summary: Import candidates in bulk
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [items]
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     phoneNumber: { type: string }
   *                     name: { type: string }
   *                     email: { type: string, format: email }
   *                     resumeUrl: { type: string }
   *                     experienceSummary: { type: string }
   *                     profileKeywords:
   *                       type: array
   *                       items: { type: string }
   *                     aiEvaluation:
   *                       type: object
   *                       properties:
   *                         overallScore: { type: number }
   *                         atsScore: { type: number }
   *                         codingScore: { type: number }
   *                         communicationScore: { type: number }
   *                         domainScore: { type: number }
   *                         summary: { type: string }
   *     responses:
   *       200: { description: Candidate import finished }
   *       401: { description: Unauthorized }
   */
  importCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = req.auth;
      const body = req.body as CandidateImportInput;
      const result = await this.candidatesService.importCandidates(auth!.companyId, body);
      sendSuccess(res, 'Candidates import completed', result);
    } catch (error) {
      next(error);
    }
  };
}

export const candidatesController = new CandidatesController(candidatesService);
