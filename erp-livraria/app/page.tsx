import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Book, DollarSign, ShoppingCart, Users } from 'lucide-react';

export default function Home() {
  redirect('/login');
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-card transition-all hover:shadow-lg hover:border-primary-200">
      <div className="mb-4 rounded-full bg-primary-100 p-3 w-12 h-12 flex items-center justify-center text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-neutral-900">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
} 