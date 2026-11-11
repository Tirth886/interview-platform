import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../../constants/http';
import { sendSuccess } from '../../middlewares/response';
import {
  CreateScheduleInviteInput,
  ScheduleTokenParamsInput,
  SubmitScheduleInput,
} from './schedule-invites.schema';
import { scheduleInvitesService } from './schedule-invites.service';

export class ScheduleInvitesController {
  getByToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as ScheduleTokenParamsInput;
      const result = await scheduleInvitesService.getInviteByToken(params.token);
      sendSuccess(res, 'Schedule invite fetched', result);
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as ScheduleTokenParamsInput;
      const body = req.body as SubmitScheduleInput;
      const result = await scheduleInvitesService.submitSchedule(params.token, body.startAt);
      sendSuccess(res, 'Interview scheduled', result, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  createForCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const candidateId = req.params.candidateId as string;
      const body = (req.body ?? {}) as CreateScheduleInviteInput;
      const result = await scheduleInvitesService.createInviteForCandidate(
        req.auth!.companyId,
        candidateId,
        body
      );
      sendSuccess(res, 'Schedule invite sent', result, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };
}

export const scheduleInvitesController = new ScheduleInvitesController();
