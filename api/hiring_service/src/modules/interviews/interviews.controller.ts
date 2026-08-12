import { NextFunction, Request, Response } from 'express';
import { sendSuccess, sendError } from '../../middlewares/response';
import { HTTP_STATUS } from '../../constants/http';
import { InterviewsService, interviewsService } from './interviews.service';
import {
  CreateInterviewInput,
  InterviewIdParamsInput,
  ListInterviewsQueryInput,
  RescheduleInterviewInput,
  UpdateInterviewStatusInput,
  InterviewSessionParamsInput,
} from './interviews.schema';

export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  /**
   * @openapi
   * /api/v1/interviews:
   *   get:
   *     tags: [Interviews]
   *     summary: List interviews using optional filters
   *     parameters:
   *       - in: query
   *         name: from
   *         schema: { type: string, format: date-time }
   *       - in: query
   *         name: to
   *         schema: { type: string, format: date-time }
   *       - in: query
   *         name: candidateId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [scheduled, in-progress, completed, cancelled] }
   *       - in: query
   *         name: roundType
   *         schema: { type: string, enum: [ai-interview, coding] }
   *     responses:
   *       200: { description: Interview list returned }
   *       401: { description: Unauthorized }
   */
  listInterviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListInterviewsQueryInput;
      const result = await this.interviewsService.listInterviews(req.auth!.companyId, query);
      sendSuccess(res, 'Interviews fetched', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews:
   *   post:
   *     tags: [Interviews]
   *     summary: Schedule interview for candidate
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [candidateId, roundType, startAt, durationMinutes, instructions]
   *             properties:
   *               candidateId: { type: string, format: uuid }
   *               roundType: { type: string, enum: [ai-interview, coding] }
   *               startAt: { type: string, format: date-time }
   *               durationMinutes: { type: integer, minimum: 15 }
   *               instructions: { type: string }
   *     responses:
   *       201: { description: Interview scheduled }
   *       401: { description: Unauthorized }
   *       404: { description: Candidate not found }
   */
  createInterview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateInterviewInput;
      const result = await this.interviewsService.scheduleInterview(req.auth!.companyId, body);
      sendSuccess(res, 'Interview scheduled', result, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews/{interviewId}/reschedule:
   *   patch:
   *     tags: [Interviews]
   *     summary: Reschedule existing interview
   *     parameters:
   *       - in: path
   *         name: interviewId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [startAt, durationMinutes]
   *             properties:
   *               startAt: { type: string, format: date-time }
   *               durationMinutes: { type: integer, minimum: 15 }
   *     responses:
   *       200: { description: Interview rescheduled }
   *       400: { description: Invalid status for reschedule }
   *       401: { description: Unauthorized }
   *       404: { description: Interview not found }
   */
  rescheduleInterview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as InterviewIdParamsInput;
      const body = req.body as RescheduleInterviewInput;
      const result = await this.interviewsService.rescheduleInterview(
        req.auth!.companyId,
        params.interviewId,
        body
      );
      sendSuccess(res, 'Interview rescheduled', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews/{interviewId}/cancel:
   *   patch:
   *     tags: [Interviews]
   *     summary: Cancel scheduled interview
   *     parameters:
   *       - in: path
   *         name: interviewId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Interview cancelled }
   *       401: { description: Unauthorized }
   *       404: { description: Interview not found }
   */
  cancelInterview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as InterviewIdParamsInput;
      const result = await this.interviewsService.cancelInterview(
        req.auth!.companyId,
        params.interviewId
      );
      sendSuccess(res, 'Interview cancelled', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews/{interviewId}/status:
   *   patch:
   *     tags: [Interviews]
   *     summary: Update interview status and optional AI result
   *     parameters:
   *       - in: path
   *         name: interviewId
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
   *               status: { type: string, enum: [scheduled, in-progress, completed, cancelled] }
   *               aiResult: { type: string }
   *     responses:
   *       200: { description: Interview status updated }
   *       401: { description: Unauthorized }
   *       404: { description: Interview not found }
   */
  updateInterviewStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = req.params as unknown as InterviewIdParamsInput;
      const body = req.body as UpdateInterviewStatusInput;
      const result = await this.interviewsService.updateInterviewStatus(
        req.auth!.companyId,
        params.interviewId,
        body
      );
      sendSuccess(res, 'Interview status updated', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews/{interviewId}:
   *   get:
   *     tags: [Interviews]
   *     summary: Get interview detail with candidate summary
   *     parameters:
   *       - in: path
   *         name: interviewId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Interview detail returned }
   *       401: { description: Unauthorized }
   *       404: { description: Interview or candidate not found }
   */
  getInterviewById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as InterviewIdParamsInput;
      const result = await this.interviewsService.getInterviewById(
        req.auth!.companyId,
        params.interviewId
      );
      sendSuccess(res, 'Interview fetched', result);
    } catch (error) {
      next(error);
    }
  };

  validateInterviewSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = req.params as unknown as InterviewSessionParamsInput;
      const query = req.query as unknown as { role: string; user: string };
      const result = await this.interviewsService.validateInterviewSession(
        params.sessionId,
        query.role,
        query.user
      );
      sendSuccess(res, 'Interview session validated', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews/session/{sessionId}/join:
   *   patch:
   *     tags: [Interviews]
   *     summary: Join or reopen an interview session as a candidate
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties: {}
   *     responses:
   *       200: { description: Interview session joined }
   *       401: { description: Unauthorized }
   *       404: { description: Interview session not found }
   */
  joinInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as InterviewSessionParamsInput;
      const query = req.query as unknown as { role: string; user: string };
      const result = await this.interviewsService.joinInterviewSession(
        params.sessionId,
        query.role,
        query.user
      );
      sendSuccess(res, 'Interview session joined', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/interviews/by-email:
   *   get:
   *     tags: [Interviews]
   *     summary: List interviews by candidate email (no auth required)
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema: { type: string, format: email }
   *     responses:
   *       200: { description: Interview list returned }
   *       400: { description: Email parameter missing }
   */
  listInterviewsByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.query as { email?: string };
      if (!email || !email.trim()) {
        sendError(res, 'Email parameter is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }
      const result = await this.interviewsService.listInterviewsByEmail(email.trim());
      sendSuccess(res, 'Interviews fetched', result);
    } catch (error) {
      next(error);
    }
  };
}

export const interviewsController = new InterviewsController(interviewsService);
