import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../middlewares/response';
import { stagesService } from './stages.service';

export class StagesController {
  listStages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await stagesService.listStages();
      sendSuccess(res, 'Stages fetched', result);
    } catch (error) {
      next(error);
    }
  };
}

export const stagesController = new StagesController();
