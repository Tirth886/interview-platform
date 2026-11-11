import amqp, { Channel } from 'amqplib';
import { env } from '../../config/env';
import { logger } from '../../middlewares/logger';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(env.RESUME_PARSE_QUEUE, { durable: true });

  connection.on('close', () => {
    connection = null;
    channel = null;
  });

  return channel;
}

export type ResumeParseRequestedEvent = {
  event: 'resume.parse.requested';
  candidate_id: string;
  company_id: string;
  workflow_id?: string | null;
  resume_key: string;
  resume_url?: string | null;
  file_name?: string | null;
};

export async function publishResumeParseRequested(
  payload: ResumeParseRequestedEvent
): Promise<void> {
  try {
    const ch = await getChannel();
    const body = Buffer.from(JSON.stringify(payload));
    ch.sendToQueue(env.RESUME_PARSE_QUEUE, body, {
      persistent: true,
      contentType: 'application/json',
    });
  } catch (error) {
    logger.error({ err: error, payload }, 'Failed to publish resume.parse.requested');
    // Do not fail candidate creation if broker is down
  }
}
