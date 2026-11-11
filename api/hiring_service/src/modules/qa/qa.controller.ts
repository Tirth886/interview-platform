import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../middlewares/response';
import {
  BankIdParamsInput,
  CreateQaBankInput,
  ReplaceQaQuestionsInput,
  UpdateQaBankInput,
} from './qa.schema';
import { qaService } from './qa.service';

export class QaController {
  listBanks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await qaService.listBanks(req.auth!.companyId);
      sendSuccess(res, 'Q&A banks fetched', result);
    } catch (error) {
      next(error);
    }
  };

  getBank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as BankIdParamsInput;
      const result = await qaService.getBank(req.auth!.companyId, params.bankId);
      sendSuccess(res, 'Q&A bank fetched', result);
    } catch (error) {
      next(error);
    }
  };

  createBank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateQaBankInput;
      const result = await qaService.createBank(req.auth!.companyId, body);
      sendSuccess(res, 'Q&A bank created', result, 201);
    } catch (error) {
      next(error);
    }
  };

  updateBank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as BankIdParamsInput;
      const body = req.body as UpdateQaBankInput;
      const result = await qaService.updateBank(req.auth!.companyId, params.bankId, body);
      sendSuccess(res, 'Q&A bank updated', result);
    } catch (error) {
      next(error);
    }
  };

  deleteBank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as BankIdParamsInput;
      await qaService.deleteBank(req.auth!.companyId, params.bankId);
      sendSuccess(res, 'Q&A bank deleted', { ok: true });
    } catch (error) {
      next(error);
    }
  };

  replaceQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as BankIdParamsInput;
      const body = req.body as ReplaceQaQuestionsInput;
      const result = await qaService.replaceQuestions(
        req.auth!.companyId,
        params.bankId,
        body
      );
      sendSuccess(res, 'Q&A questions saved', result);
    } catch (error) {
      next(error);
    }
  };
}

export const qaController = new QaController();
