 "use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewLeadPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/leads/new/step-1');
    }, [router]);

    return null;
}
