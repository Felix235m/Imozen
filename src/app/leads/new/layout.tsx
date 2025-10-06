import DashboardLayout from "@/app/dashboard/layout";

export default function NewLeadFlowLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
