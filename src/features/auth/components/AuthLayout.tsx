"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { EASE, Reveal } from "@/components/motion";

// Flowstep screen 3 desktop split: hero image + quote on the left half, form on the right.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-full w-full flex-1 flex-col md:flex-row">
      <div className="relative hidden h-[600px] w-1/2 overflow-hidden md:block lg:h-auto">
        {/* Slow settle on the hero, matching the collection and home heroes. */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduce ? 0.01 : 2.2, ease: EASE.out }}
        >
          <Image
            src="https://images.unsplash.com/photo-1772127822552-ce9ef537bdcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
            alt="Elegant wedding stage with gold lighting"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/45 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-12">
          <Reveal immediate direction="up" distance={20} delay={0.3}>
            <p className="max-w-md font-serif text-3xl leading-snug text-foreground">Every detail, beautifully arranged.</p>
          </Reveal>
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-10 md:w-1/2 md:px-12">
        <Reveal immediate direction="up" distance={16} className="flex w-full justify-center">
          {children}
        </Reveal>
      </div>
    </div>
  );
}
