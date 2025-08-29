import { PriceTracker } from '@/components/ui/price-tracker';

export default function PriceTrackerPage() {
  // In a real app, you'd get userId from authentication
  const userId = 'user_123';

  return (
    <div className="container mx-auto px-4 py-8">
      <PriceTracker userId={userId} />
    </div>
  );
}
