import { redirect } from 'next/navigation';

// The forced change-password workflow has been removed.
// Redirect anyone who hits this URL to the profile page.
export default function ChangePasswordPage() {
    redirect('/profile');
}
