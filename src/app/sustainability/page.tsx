import { SustainabilityDashboard } from '@/components/ui/sustainability-dashboard';

export default function SustainabilityPage() {
  // In a real app, you'd get userId from authentication
  const userId = 'user_123';

  return (
    <div className="container mx-auto px-4 py-8">
      <SustainabilityDashboard userId={userId} />
    </div>
  );
}
