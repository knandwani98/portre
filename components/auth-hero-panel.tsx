import Image from 'next/image';

export function AuthHeroPanel() {
  return (
    <aside className="fixed inset-0 z-0 hidden h-screen w-screen overflow-hidden bg-primary text-primary-foreground md:flex md:flex-col">
      <div className="relative flex h-full w-1/2 flex-col overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-[-18%] top-1/2 aspect-square w-[130%] -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 60% 48%, rgb(255 255 255 / 0.14) 0 38%, transparent 68%)',
            }}
          />
          <div
            className="absolute left-[-8%] top-1/2 aspect-square w-[112%] -translate-y-1/2 rounded-full opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgb(255 255 255 / 0.55) 1.15px, transparent 1.25px)',
              backgroundSize: '10px 10px',
              maskImage:
                'radial-gradient(circle at 62% 48%, black 0 34%, transparent 64%)',
              WebkitMaskImage:
                'radial-gradient(circle at 62% 48%, black 0 34%, transparent 64%)',
            }}
          />
          <Image
            src="/logo.svg"
            alt=""
            width={720}
            height={720}
            className="absolute -left-16 top-[42%] w-[78%] max-w-none -translate-y-1/2 rounded-[22%] opacity-25"
            priority
          />
        </div>

        <div className="relative z-10 mt-auto max-w-lg p-8 lg:p-12">
          <p className="text-sm text-primary-foreground/80">Portrait validation</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Keep only the portraits that work.
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Import photos. PortreAI checks faces, sharpness, and duplicates.
          </p>
        </div>
      </div>
    </aside>
  );
}
