import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        layout: { logoPlacement: 'none' },
      }}
    />
  );
}
