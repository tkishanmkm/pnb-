
import { defaultState } from '@/lib/mock-data';
import BeneficiaryDetailsClient from './beneficiary-details-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// This function is required for static exports of dynamic routes.
// We return an empty array because beneficiaries are dynamic and not known at build time.
// Next.js will generate pages on-demand on the client.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const payee = defaultState.payees.find(p => p.id === params.id);
  const title = payee ? `${payee.nickname || payee.name} | PNB eBank` : 'Beneficiary Details | PNB eBank';
  return {
    title,
    description: `Details for beneficiary ${payee?.name}.`,
  };
}

export default function BeneficiaryDetailsPage({ params }: { params: { id: string } }) {
  // The server component renders the client component, passing the ID.
  // The client component will fetch the rest of the data from the global state.
  return <BeneficiaryDetailsClient payeeId={params.id} />;
}
