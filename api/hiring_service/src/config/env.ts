import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().default(900), // seconds, default 15 min
  JWT_REFRESH_EXPIRES_IN: z.coerce.number().default(604800), // seconds, default 7 days

  // Google SSO
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // Microsoft SSO
  MICROSOFT_CLIENT_ID: z.string().min(1),
  MICROSOFT_CLIENT_SECRET: z.string().min(1),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  MICROSOFT_CALLBACK_URL: z.string().url(),

  // Frontend
  FRONTEND_URL: z.string().url(),
  INTERVIEW_PORTAL_URL: z.string().url().default('http://localhost:5174'),

  // File uploads (local disk now; swap STORAGE_DRIVER to s3 later)
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),

  // Resume batch upload limits (adjustable)
  RESUME_UPLOAD_MAX_FILES: z.coerce.number().int().min(1).max(100).default(20),
  RESUME_UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(50).default(10),
  RESUME_UPLOAD_ALLOWED_EXTENSIONS: z.string().min(1).default('pdf,doc,docx'),

  // RabbitMQ (resume parse jobs)
  RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5672'),
  RESUME_PARSE_QUEUE: z.string().default('resume.parse.requested'),
  INTERNAL_SERVICE_TOKEN: z.string().min(1).default('dev-internal-token'),

  // Outbound email via Resend (optional — logs to console when RESEND_API_KEY is unset)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
