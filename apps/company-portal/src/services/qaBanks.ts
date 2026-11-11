import { companyHttpClient } from './http';

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

export type QaOption = {
  id: string;
  optionText: string;
  isCodeView: boolean;
  isCorrect: boolean;
  orderIndex: number;
};

export type QaQuestion = {
  id: string;
  questionText: string;
  isCodeView: boolean;
  orderIndex: number;
  options: QaOption[];
};

export type QaBank = {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QaBankDetail = QaBank & {
  questions: QaQuestion[];
};

const base = '/api/v1/qa-banks';

const mapError = (error: unknown, fallback: string): Error => {
  const httpError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };
  return new Error(httpError.response?.data?.message ?? fallback);
};

export async function listQaBanks(token: string): Promise<QaBank[]> {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ items: QaBank[] }>>(base, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.items ?? [];
  } catch (error: unknown) {
    throw mapError(error, 'Unable to load Q&A banks.');
  }
}

export async function getQaBank(bankId: string, token: string): Promise<QaBankDetail> {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ bank: QaBankDetail }>>(
      `${base}/${bankId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data.bank;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to load Q&A bank.');
  }
}

export async function createQaBank(name: string, token: string): Promise<QaBank> {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<{ bank: QaBank }>>(
      base,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data.bank;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to create Q&A bank.');
  }
}

export async function updateQaBank(
  bankId: string,
  name: string,
  token: string
): Promise<QaBank> {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ bank: QaBank }>>(
      `${base}/${bankId}`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data.bank;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to update Q&A bank.');
  }
}

export async function deleteQaBank(bankId: string, token: string): Promise<void> {
  try {
    await companyHttpClient.delete(`${base}/${bankId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: unknown) {
    throw mapError(error, 'Unable to delete Q&A bank.');
  }
}

export async function saveQaQuestions(
  bankId: string,
  questions: Array<{
    id?: string;
    questionText: string;
    isCodeView: boolean;
    orderIndex?: number;
    options: Array<{
      id?: string;
      optionText: string;
      isCodeView: boolean;
      isCorrect: boolean;
      orderIndex?: number;
    }>;
  }>,
  token: string
): Promise<QaBankDetail> {
  try {
    const response = await companyHttpClient.put<ApiEnvelope<{ bank: QaBankDetail }>>(
      `${base}/${bankId}/questions`,
      { questions },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data.bank;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to save questions.');
  }
}
