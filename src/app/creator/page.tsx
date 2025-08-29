import { CreatorDashboard } from '@/components/ui/creator-dashboard';

export default function CreatorPage() {
  // In a real app, you'd get userId from authentication
  const userId = 'user_123';

  return (
    <div className="container mx-auto px-4 py-8">
      <CreatorDashboard userId={userId} />
    </div>
  );
}
