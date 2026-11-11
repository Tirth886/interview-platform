import { PoolClient } from 'pg';
import { db } from '../../providers/database';

export type QaBankRow = {
  id: string;
  company_id: string;
  name: string;
  is_delete: boolean;
  created_at: Date;
  updated_at: Date;
  question_count?: string | number;
};

export type QaQuestionRow = {
  id: string;
  company_id: string;
  qa_bank_id: string;
  question_text: string;
  is_code_view: boolean;
  order_index: number;
  is_delete: boolean;
  created_at: Date;
  updated_at: Date;
};

export type QaOptionRow = {
  id: string;
  company_id: string;
  question_id: string;
  option_text: string;
  is_code_view: boolean;
  is_correct: boolean;
  order_index: number;
  is_delete: boolean;
  created_at: Date;
  updated_at: Date;
};

export class QaRepository {
  async listBanks(companyId: string, client?: PoolClient): Promise<QaBankRow[]> {
    const result = await (client ?? db).query<QaBankRow>(
      `SELECT
         b.*,
         (
           SELECT COUNT(*)::int
           FROM qa_questions q
           WHERE q.qa_bank_id = b.id AND q.is_delete = FALSE
         ) AS question_count
       FROM qa_banks b
       WHERE b.company_id = $1 AND b.is_delete = FALSE
       ORDER BY b.updated_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findBank(
    companyId: string,
    bankId: string,
    client?: PoolClient
  ): Promise<QaBankRow | null> {
    const result = await (client ?? db).query<QaBankRow>(
      `SELECT * FROM qa_banks
       WHERE company_id = $1 AND id = $2 AND is_delete = FALSE
       LIMIT 1`,
      [companyId, bankId]
    );
    return result.rows[0] ?? null;
  }

  async createBank(
    input: { companyId: string; name: string },
    client?: PoolClient
  ): Promise<QaBankRow> {
    const result = await (client ?? db).query<QaBankRow>(
      `INSERT INTO qa_banks (company_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [input.companyId, input.name]
    );
    return result.rows[0];
  }

  async updateBank(
    companyId: string,
    bankId: string,
    patch: { name?: string },
    client?: PoolClient
  ): Promise<QaBankRow | null> {
    const result = await (client ?? db).query<QaBankRow>(
      `UPDATE qa_banks
       SET
         name = COALESCE($3, name),
         updated_at = NOW()
       WHERE company_id = $1 AND id = $2 AND is_delete = FALSE
       RETURNING *`,
      [companyId, bankId, patch.name ?? null]
    );
    return result.rows[0] ?? null;
  }

  async softDeleteBank(
    companyId: string,
    bankId: string,
    client?: PoolClient
  ): Promise<boolean> {
    const exec = client ?? db;
    await exec.query(
      `UPDATE qa_options o
       SET is_delete = TRUE, updated_at = NOW()
       FROM qa_questions q
       WHERE o.question_id = q.id
         AND q.qa_bank_id = $2
         AND q.company_id = $1
         AND o.is_delete = FALSE`,
      [companyId, bankId]
    );
    await exec.query(
      `UPDATE qa_questions
       SET is_delete = TRUE, updated_at = NOW()
       WHERE company_id = $1 AND qa_bank_id = $2 AND is_delete = FALSE`,
      [companyId, bankId]
    );
    const result = await exec.query(
      `UPDATE qa_banks
       SET is_delete = TRUE, updated_at = NOW()
       WHERE company_id = $1 AND id = $2 AND is_delete = FALSE`,
      [companyId, bankId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listQuestions(
    companyId: string,
    bankId: string,
    client?: PoolClient
  ): Promise<QaQuestionRow[]> {
    const result = await (client ?? db).query<QaQuestionRow>(
      `SELECT *
       FROM qa_questions
       WHERE company_id = $1 AND qa_bank_id = $2 AND is_delete = FALSE
       ORDER BY order_index ASC, created_at ASC`,
      [companyId, bankId]
    );
    return result.rows;
  }

  async listOptionsForQuestions(
    companyId: string,
    questionIds: string[],
    client?: PoolClient
  ): Promise<QaOptionRow[]> {
    if (questionIds.length === 0) return [];
    const result = await (client ?? db).query<QaOptionRow>(
      `SELECT *
       FROM qa_options
       WHERE company_id = $1
         AND question_id = ANY($2::uuid[])
         AND is_delete = FALSE
       ORDER BY order_index ASC, created_at ASC`,
      [companyId, questionIds]
    );
    return result.rows;
  }

  async replaceQuestions(
    companyId: string,
    bankId: string,
    questions: Array<{
      id: string;
      questionText: string;
      isCodeView: boolean;
      orderIndex: number;
      options: Array<{
        id: string;
        optionText: string;
        isCodeView: boolean;
        isCorrect: boolean;
        orderIndex: number;
      }>;
    }>,
    client?: PoolClient
  ): Promise<void> {
    const exec = client ?? db;
    const activeQuestionIds = questions.map((q) => q.id);

    if (activeQuestionIds.length === 0) {
      await exec.query(
        `UPDATE qa_options o
         SET is_delete = TRUE, updated_at = NOW()
         FROM qa_questions q
         WHERE o.question_id = q.id
           AND q.qa_bank_id = $2
           AND q.company_id = $1
           AND o.is_delete = FALSE`,
        [companyId, bankId]
      );
      await exec.query(
        `UPDATE qa_questions
         SET is_delete = TRUE, updated_at = NOW()
         WHERE company_id = $1 AND qa_bank_id = $2 AND is_delete = FALSE`,
        [companyId, bankId]
      );
      return;
    }

    await exec.query(
      `UPDATE qa_questions
       SET is_delete = TRUE, updated_at = NOW()
       WHERE company_id = $1 AND qa_bank_id = $2 AND is_delete = FALSE
         AND NOT (id = ANY($3::uuid[]))`,
      [companyId, bankId, activeQuestionIds]
    );

    await exec.query(
      `UPDATE qa_options o
       SET is_delete = TRUE, updated_at = NOW()
       FROM qa_questions q
       WHERE o.question_id = q.id
         AND q.qa_bank_id = $2
         AND q.company_id = $1
         AND o.is_delete = FALSE
         AND NOT (q.id = ANY($3::uuid[]))`,
      [companyId, bankId, activeQuestionIds]
    );

    for (const question of questions) {
      await exec.query(
        `INSERT INTO qa_questions (
           id, company_id, qa_bank_id, question_text, is_code_view, order_index, is_delete
         ) VALUES ($1,$2,$3,$4,$5,$6,FALSE)
         ON CONFLICT (id) DO UPDATE SET
           question_text = EXCLUDED.question_text,
           is_code_view = EXCLUDED.is_code_view,
           order_index = EXCLUDED.order_index,
           is_delete = FALSE,
           updated_at = NOW()`,
        [
          question.id,
          companyId,
          bankId,
          question.questionText,
          question.isCodeView,
          question.orderIndex,
        ]
      );

      const activeOptionIds = question.options.map((o) => o.id);
      if (activeOptionIds.length === 0) {
        await exec.query(
          `UPDATE qa_options
           SET is_delete = TRUE, updated_at = NOW()
           WHERE company_id = $1 AND question_id = $2 AND is_delete = FALSE`,
          [companyId, question.id]
        );
      } else {
        await exec.query(
          `UPDATE qa_options
           SET is_delete = TRUE, updated_at = NOW()
           WHERE company_id = $1 AND question_id = $2 AND is_delete = FALSE
             AND NOT (id = ANY($3::uuid[]))`,
          [companyId, question.id, activeOptionIds]
        );
      }

      for (const option of question.options) {
        await exec.query(
          `INSERT INTO qa_options (
             id, company_id, question_id, option_text, is_code_view, is_correct, order_index, is_delete
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)
           ON CONFLICT (id) DO UPDATE SET
             option_text = EXCLUDED.option_text,
             is_code_view = EXCLUDED.is_code_view,
             is_correct = EXCLUDED.is_correct,
             order_index = EXCLUDED.order_index,
             is_delete = FALSE,
             updated_at = NOW()`,
          [
            option.id,
            companyId,
            question.id,
            option.optionText,
            option.isCodeView,
            option.isCorrect,
            option.orderIndex,
          ]
        );
      }
    }

    await exec.query(
      `UPDATE qa_banks SET updated_at = NOW() WHERE company_id = $1 AND id = $2`,
      [companyId, bankId]
    );
  }
}

export const qaRepository = new QaRepository();
