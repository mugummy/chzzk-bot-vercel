import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardClientWrapper from '@/components/dashboard/DashboardClientWrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen bg-[#0a0a0f]">
        <DashboardNav user={{
          name: session.channelName,
          image: session.channelImageUrl,
        }} />
        <main className="lg:pl-72">
          <div className="p-4 lg:p-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </DashboardClientWrapper>
  );
}
