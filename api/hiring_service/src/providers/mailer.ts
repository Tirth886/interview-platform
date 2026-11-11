import { env } from '../config/env';
import { logger } from '../middlewares/logger';

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  delivered: boolean;
  mode: 'resend' | 'console';
  id?: string;
};

const RESEND_API_URL = 'https://api.resend.com/emails';

const getFromAddress = (): string =>
  env.RESEND_FROM?.trim() || 'Acme Talent <onboarding@resend.dev>';

export const sendMail = async (input: SendMailInput): Promise<SendMailResult> => {
  if (!env.RESEND_API_KEY) {
    logger.info(
      {
        to: input.to,
        subject: input.subject,
        text: input.text,
      },
      'Email logged (RESEND_API_KEY not set)'
    );
    return { delivered: false, mode: 'console' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok) {
      logger.error(
        {
          status: response.status,
          payload,
          to: input.to,
          subject: input.subject,
        },
        'Resend send failed'
      );
      logger.info(
        { to: input.to, subject: input.subject, text: input.text },
        'Email logged after Resend failure'
      );
      return { delivered: false, mode: 'console' };
    }

    return { delivered: true, mode: 'resend', id: payload?.id };
  } catch (error) {
    logger.error({ err: error, to: input.to, subject: input.subject }, 'Resend send failed');
    logger.info(
      { to: input.to, subject: input.subject, text: input.text },
      'Email logged after Resend failure'
    );
    return { delivered: false, mode: 'console' };
  }
};
