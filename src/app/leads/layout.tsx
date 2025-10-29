import DashboardLayout from "../dashboard/layout";

export default function LeadsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
