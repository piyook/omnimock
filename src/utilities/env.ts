/* eslint-disable  @typescript-eslint/naming-convention -- we want env vars to be all caps not strict camelcase */
import { z } from 'zod';

const envSchema = z.object({
	PROJECT_NAME: z.string(),
	SERVER_PORT: z.string(),
	USE_API_URL_PREFIX: z.string(),
});

export const env = envSchema.parse(process.env);

export const prefix = env?.USE_API_URL_PREFIX
	? `${env.USE_API_URL_PREFIX}/`
	: '';
