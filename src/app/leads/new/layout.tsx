import { NewLeadLayout } from '@/components/leads/new-lead-layout';

export default function NewLeadFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NewLeadLayout>{children}</NewLeadLayout>;
}
