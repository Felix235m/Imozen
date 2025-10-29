"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLeadPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/leads/new/step-1');
  }, [router]);

  return null;
}
