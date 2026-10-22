import { config } from 'dotenv';
config();

import '@/ai/flows/delete-chat-history-flow.ts';
import '@/ai/flows/extract-transactions-from-pdf.ts';
import '@/ai/flows/get-transaction-details.ts';
import '@/ai/flows/verify-user.ts';
import '@/ai/flows/agent-chat-flow.ts';
import '@/ai/flows/ai-statement-analysis.ts';
