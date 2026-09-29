import { SignUp } from '@clerk/nextjs';
import { clerkAuthAppearance } from '@/components/clerk-auth-appearance';

export default function SignUpPage() {
  return <SignUp appearance={clerkAuthAppearance} />;
}
