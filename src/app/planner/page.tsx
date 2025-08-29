import { Planner } from '@/components/ui/planner';

export default function PlannerPage() {
  const userId = 'demo-user-123';
  return (
    <div className="container mx-auto px-4 py-8" aria-labelledby="planner-heading">
      <h1 id="planner-heading" className="text-3xl font-bold mb-4">Planner</h1>
      <Planner userId={userId} />
    </div>
  );
}
