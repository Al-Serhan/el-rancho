import Navbar from '@/components/trading/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rust-900 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
