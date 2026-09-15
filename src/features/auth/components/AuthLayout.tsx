import Image from "next/image";

// Flowstep screen 3 desktop split: hero image + quote on the left half, form on the right.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col md:flex-row">
      <div className="relative hidden h-[600px] w-1/2 md:block lg:h-auto">
        <Image
          src="https://images.unsplash.com/photo-1772127822552-ce9ef537bdcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
          alt="Elegant wedding stage with gold lighting"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-12">
          <p className="max-w-md font-serif text-3xl leading-snug text-foreground">Every detail, beautifully arranged.</p>
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-10 md:w-1/2 md:px-12">{children}</div>
    </div>
  );
}
