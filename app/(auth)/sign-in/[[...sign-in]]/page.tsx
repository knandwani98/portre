import { SignIn } from '@clerk/nextjs';
import { clerkAuthAppearance } from '@/components/clerk-auth-appearance';

export default function SignInPage() {
  return <SignIn appearance={clerkAuthAppearance} />;
}
