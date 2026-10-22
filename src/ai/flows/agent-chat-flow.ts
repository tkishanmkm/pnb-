
'use server';

/**
 * @fileOverview A comprehensive Genkit flow for handling a realistic AI banking agent conversation.
 *
 * - agentChat - The main function that orchestrates the AI agent's responses.
 * - AgentChatInput - The input type for the agentChat function.
 * - AgentChatOutput - The return type for the agentChat function.
 * - This flow manages conversation state, uses tools for verification and data retrieval,
 *   and follows a structured conversational path.
 */

import {ai} from '@/ai/genkit';
import {z, type MessageData} from 'genkit';
import type {Transaction, User, Payee} from '@/lib/types';

const VerifyUserToolInputSchema = z.object({
  name: z.string().describe("The user's full name."),
  accountNumber: z.string().describe("The user's bank account number."),
  mobileNumberLast4: z.string().describe("The last four digits of the user's registered mobile number."),
});

const GetTransactionDetailsToolInputSchema = z.object({
  date: z.string().optional().describe('The specific date of the transaction (e.g., "yesterday", "July 25th").'),
  amount: z.number().optional().describe('The amount of the transaction.'),
  payee: z.string().optional().describe('The recipient of the transaction.'),
});

const GetBeneficiaryDetailsToolInputSchema = z.object({
    name: z.string().describe("The name or nickname of the beneficiary to look up."),
});

const AgentChatInputSchema = z.object({
  userId: z.string(),
  user: z.custom<User>(),
  transactions: z.custom<Transaction[]>(),
  payees: z.custom<Payee[]>(),
  history: z.custom<MessageData[]>(),
  agentName: z.string(),
  isVerified: z.boolean(),
});
type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

const AgentChatOutputSchema = z.object({
  response: z.string().describe("The agent's next response in the conversation."),
  isVerified: z.boolean().describe("The updated verification status of the user."),
  endChat: z.boolean().describe("A flag to indicate if the conversation should be terminated."),
});
export type AgentChatOutput = z.infer<typeof AgentChatOutputSchema>;


const indianAgentNames = ["Priya", "Rahul", "Anjali", "Rohan", "Sneha", "Vikram", "Neha", "Amit"];

// Tool Definitions
const verifyUserTool = ai.defineTool(
    {
        name: 'verifyUserIdentity',
        description: "Verifies the user's identity using their full name, account number, and the last four digits of their mobile number. This tool should only be called after the user has provided all three pieces of information. Do not call this tool if the user is already verified.",
        inputSchema: VerifyUserToolInputSchema,
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string()
        }),
    },
    async (input, context) => {
        const user = context.context.user as User;
        const account = user.accounts?.[0];

        const isNameMatch = input.name.trim().toLowerCase() === user.name.trim().toLowerCase();
        const isAccountMatch = account?.accountNumber
          ? account.accountNumber.endsWith(input.accountNumber.slice(-4))
          : false;
        const isMobileMatch = user.mobileNumber.endsWith(input.mobileNumberLast4);

        if (isNameMatch && isAccountMatch && isMobileMatch) {
            return {
                success: true,
                message: "Thank you for your patience. I have successfully verified your account. How can I assist you further with your query? For example, you can ask for transaction details by providing a date and amount, or ask for details about a beneficiary."
            };
        } else {
            return {
                success: false,
                message: "I'm sorry, the details you provided do not match our records. Please check the information and try again."
            };
        }
    }
);


const getTransactionDetailsTool = ai.defineTool(
    {
        name: 'getTransactionDetails',
        description: "Retrieves details for one or more transactions based on user-provided criteria like date, amount, or payee. This tool should only be used AFTER the user has been successfully verified.",
        inputSchema: GetTransactionDetailsToolInputSchema,
        outputSchema: z.string(),
    },
    async (input, context) => {
        const transactions = context.context.transactions as Transaction[];

        let filtered = transactions;

        if (input.amount) {
            filtered = filtered.filter(t => Math.abs(t.amount) === input.amount);
        }
        if (input.payee) {
            filtered = filtered.filter(t => t.payee?.toLowerCase().includes(input.payee!.toLowerCase()));
        }
        if (input.date) {
            filtered = filtered.filter(t => new Date(t.date).toDateString() === new Date(input.date!).toDateString());
        }

        if (filtered.length === 0) {
            return "I couldn't find any transactions matching those criteria. Would you like to try searching with different details?";
        }

        const details = filtered.map(tx => {
            const date = new Date(tx.date).toLocaleString();
            const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount);
            return `On ${date}, a transaction of ${amount} was made. Description: "${tx.description}". The reference number is ${tx.reference}.`;
        }).join('\n');
        
        return "Thank you for waiting. I have found the following transaction(s):\n" + details + "\nIs there anything else I can help with?";
    }
);

const getBeneficiaryDetailsTool = ai.defineTool(
    {
        name: 'getBeneficiaryDetails',
        description: "Retrieves details for a saved beneficiary (payee) based on their name or nickname. This tool should only be used AFTER the user has been successfully verified.",
        inputSchema: GetBeneficiaryDetailsToolInputSchema,
        outputSchema: z.string(),
    },
    async (input, context) => {
        const payees = context.context.payees as Payee[];

        const foundPayee = payees.find(p => 
            p.name.toLowerCase().includes(input.name.toLowerCase()) ||
            p.nickname?.toLowerCase().includes(input.name.toLowerCase())
        );

        if (!foundPayee) {
            return `I could not find a beneficiary named "${input.name}". Would you like me to search for someone else?`;
        }

        return `I found the beneficiary "${foundPayee.name}". Their account number is ${foundPayee.accountNumber} with ${foundPayee.bank} (IFSC: ${foundPayee.ifsc}). Is there anything else I can help with?`;
    }
);


// The main flow
const agentChatFlow = ai.defineFlow(
    {
        name: 'agentChatFlow',
        inputSchema: AgentChatInputSchema,
        outputSchema: AgentChatOutputSchema,
    },
    async (input) => {
        const {user, agentName, history, isVerified} = input;
        
        const tools = [verifyUserTool, getTransactionDetailsTool, getBeneficiaryDetailsTool];
        
        const systemPrompt = `You are an AI customer service agent for Punjab National Bank. Your name is ${agentName}.
- Your persona is helpful, polite, and professional. Always use "please", "thank you", and "thank you for your patience". Address the user respectfully.
- Your primary goals are to answer user queries and perform tasks related to their bank account.
- **Verification is CRITICAL.** Wait for the user to explain their problem first. Then, if you need to access their account details, you MUST verify their identity. Politely ask for their full name, account number, and the last 4 digits of their registered mobile number. 
- After asking for their details, say "Please wait while I verify your details." and wait for the user to respond with "Ok" or a similar confirmation before you call the 'verifyUserIdentity' tool. Do not call the tool until they have confirmed to wait.
- After successful verification, the tool will output a confirmation. You should relay this and then ask the user how you can proceed with their original request.
- Once verified, you can use other tools like \`getTransactionDetails\` or \`getBeneficiaryDetails\`. When using tools, always thank the user for their patience before providing the result. For example, say "Thank you for waiting. I have found the following..."
- Keep your responses concise and to the point.
- If the user indicates they are done or says "no" when you ask if there's anything else, end the conversation with a polite closing statement like "Thank you for banking with Punjab National Bank. Have a great day!" and set endChat to true.
- When you use the verifyUserIdentity tool and it returns success, you MUST update the isVerified flag to true in your final JSON output.

Current user verification status: ${isVerified ? "VERIFIED" : "NOT VERIFIED"}.
${isVerified ? `User's Name: ${user.name}` : "The user's name is currently unknown."}
`;

        const response = await ai.generate({
            tools,
            messages: history,
            context: {
                user,
                transactions: input.transactions,
                payees: input.payees,
            },
            system: systemPrompt,
            output: {
                format: 'json',
                schema: AgentChatOutputSchema
            }
        });

        let output = response.output;
        if (!output) {
             // Handle cases where the model doesn't return structured JSON, e.g., just text
             const textResponse = response.text;
             const endChat = /thank you for banking with/i.test(textResponse);
             return {
                 response: textResponse,
                 isVerified: isVerified, // maintain current verification state
                 endChat,
             };
        }

        return output;
    }
);


// Exported wrapper function
export async function agentChat(input: AgentChatInput): Promise<AgentChatOutput> {
    return agentChatFlow(input);
}
