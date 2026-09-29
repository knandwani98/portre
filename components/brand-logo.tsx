import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const iconSize = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

type BrandLogoProps = {
  href?: string | null;
  showWordmark?: boolean;
  tagline?: string;
  size?: keyof typeof iconSize;
  className?: string;
};

export function BrandLogo({
  href = '/',
  showWordmark = true,
  tagline,
  size = 'md',
  className,
}: BrandLogoProps) {
  const px = iconSize[size];
  const content = (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Image
        src="/logo.svg"
        alt={showWordmark ? '' : 'PortreAI'}
        width={px}
        height={px}
        className="shrink-0 rounded-[22%]"
        fetchPriority="high"
      />
      {showWordmark ? (
        <span className="flex min-w-0 flex-col">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            Portre<span className="text-primary">AI</span>
          </span>
          {tagline ? (
            <span className="text-xs text-muted-foreground">{tagline}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex rounded-md outline-offset-4">
      {content}
    </Link>
  );
}
