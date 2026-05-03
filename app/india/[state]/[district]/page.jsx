import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function DistrictPage({ params }) {
  const { state, district } = params;
  
  // For now, redirect to the main events search filtered by the district name
  // This ensures users immediately see value while keeping the SEO URL structure valid
  redirect(`/?q=${encodeURIComponent(district.replace(/-/g, ' '))}`);
}
