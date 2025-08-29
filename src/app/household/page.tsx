import { HouseholdManager } from '@/components/ui/household-manager';

export default function HouseholdPage() {
  // In a real app, you'd get userId from authentication
  const userId = 'user_123';

  return (
    <div className="container mx-auto px-4 py-8">
      <HouseholdManager userId={userId} />
    </div>
  );
}
