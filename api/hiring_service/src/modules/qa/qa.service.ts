import crypto from 'crypto';
import { NotFoundError, ValidationError } from '../../middlewares/errors';
import { withTransaction } from '../../providers/database';
import {
  CreateQaBankInput,
  ReplaceQaQuestionsInput,
  UpdateQaBankInput,
} from './qa.schema';
import { QaBankRow, QaOptionRow, QaQuestionRow, qaRepository } from './qa.repository';

export type QaOptionDto = {
  id: string;
  optionText: string;
  isCodeView: boolean;
  isCorrect: boolean;
  orderIndex: number;
};

export type QaQuestionDto = {
  id: string;
  questionText: string;
  isCodeView: boolean;
  orderIndex: number;
  options: QaOptionDto[];
};

export type QaBankDto = {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QaBankDetailDto = QaBankDto & {
  questions: QaQuestionDto[];
};

const mapBank = (row: QaBankRow): QaBankDto => ({
  id: row.id,
  name: row.name,
  questionCount: Number(row.question_count ?? 0),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const mapOption = (row: QaOptionRow): QaOptionDto => ({
  id: row.id,
  optionText: row.option_text,
  isCodeView: row.is_code_view,
  isCorrect: row.is_correct,
  orderIndex: row.order_index,
});

const mapQuestion = (row: QaQuestionRow, options: QaOptionRow[]): QaQuestionDto => ({
  id: row.id,
  questionText: row.question_text,
  isCodeView: row.is_code_view,
  orderIndex: row.order_index,
  options: options.map(mapOption),
});

const validateQuestionsPayload = (payload: ReplaceQaQuestionsInput): void => {
  for (const [index, question] of payload.questions.entries()) {
    if (!question.questionText.trim()) {
      throw new ValidationError(`Question ${index + 1} text is required.`);
    }
    const filledOptions = question.options.filter((o) => o.optionText.trim());
    if (filledOptions.length < 2) {
      throw new ValidationError(`Question ${index + 1} needs at least 2 options.`);
    }
    const correctCount = filledOptions.filter((o) => o.isCorrect).length;
    if (correctCount < 1) {
      throw new ValidationError(`Question ${index + 1} needs at least one correct option.`);
    }
  }
};

export class QaService {
  async listBanks(companyId: string): Promise<{ items: QaBankDto[] }> {
    const rows = await qaRepository.listBanks(companyId);
    return { items: rows.map(mapBank) };
  }

  async getBank(companyId: string, bankId: string): Promise<{ bank: QaBankDetailDto }> {
    const bank = await qaRepository.findBank(companyId, bankId);
    if (!bank) throw new NotFoundError('Q&A bank not found');

    const questions = await qaRepository.listQuestions(companyId, bankId);
    const options = await qaRepository.listOptionsForQuestions(
      companyId,
      questions.map((q) => q.id)
    );
    const optionsByQuestion = new Map<string, QaOptionRow[]>();
    for (const option of options) {
      const list = optionsByQuestion.get(option.question_id) ?? [];
      list.push(option);
      optionsByQuestion.set(option.question_id, list);
    }

    return {
      bank: {
        ...mapBank({ ...bank, question_count: questions.length }),
        questions: questions.map((q) => mapQuestion(q, optionsByQuestion.get(q.id) ?? [])),
      },
    };
  }

  async createBank(
    companyId: string,
    payload: CreateQaBankInput
  ): Promise<{ bank: QaBankDto }> {
    const row = await qaRepository.createBank({
      companyId,
      name: payload.name.trim(),
    });
    return { bank: mapBank({ ...row, question_count: 0 }) };
  }

  async updateBank(
    companyId: string,
    bankId: string,
    payload: UpdateQaBankInput
  ): Promise<{ bank: QaBankDto }> {
    if (payload.name !== undefined && !payload.name.trim()) {
      throw new ValidationError('Q&A name is required.');
    }
    const row = await qaRepository.updateBank(companyId, bankId, {
      name: payload.name?.trim(),
    });
    if (!row) throw new NotFoundError('Q&A bank not found');
    const detail = await this.getBank(companyId, bankId);
    return { bank: detail.bank };
  }

  async deleteBank(companyId: string, bankId: string): Promise<void> {
    const deleted = await withTransaction((client) =>
      qaRepository.softDeleteBank(companyId, bankId, client)
    );
    if (!deleted) throw new NotFoundError('Q&A bank not found');
  }

  async replaceQuestions(
    companyId: string,
    bankId: string,
    payload: ReplaceQaQuestionsInput
  ): Promise<{ bank: QaBankDetailDto }> {
    const bank = await qaRepository.findBank(companyId, bankId);
    if (!bank) throw new NotFoundError('Q&A bank not found');

    validateQuestionsPayload(payload);

    const normalized = payload.questions.map((question, qIndex) => ({
      id: question.id && /^[0-9a-f-]{36}$/i.test(question.id) ? question.id : crypto.randomUUID(),
      questionText: question.questionText.trim(),
      isCodeView: Boolean(question.isCodeView),
      orderIndex: question.orderIndex ?? qIndex,
      options: question.options
        .filter((o) => o.optionText.trim())
        .map((option, oIndex) => ({
          id:
            option.id && /^[0-9a-f-]{36}$/i.test(option.id) ? option.id : crypto.randomUUID(),
          optionText: option.optionText.trim(),
          isCodeView: Boolean(option.isCodeView),
          isCorrect: Boolean(option.isCorrect),
          orderIndex: option.orderIndex ?? oIndex,
        })),
    }));

    await withTransaction(async (client) => {
      await qaRepository.replaceQuestions(companyId, bankId, normalized, client);
    });

    return this.getBank(companyId, bankId);
  }
}

export const qaService = new QaService();
