"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

// Flowstep screen 49 (desktop) — static content page, no mobile variant fetched.
export default function ContactPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!name.trim() || !contact.trim() || !message.trim()) {
      toast.error("Please fill in your name, contact and message.");
      return;
    }
    setSent(true);
    setName("");
    setContact("");
    setMessage("");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-serif text-4xl text-foreground">Talk to an Expert</h1>
        <p className="text-sm text-foreground/70">Get help planning your event — we typically reply within the hour on WhatsApp.</p>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-xl border border-primary/30 bg-card p-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-sm bg-[#25D366]">
          <MessageCircle className="size-10 text-[#1A1714]" />
        </div>
        <h2 className="font-serif text-2xl text-foreground">Chat on WhatsApp</h2>
        <p className="text-foreground/75">+91 98765 00000</p>
        <a
          href="https://wa.me/919876500000"
          target="_blank"
          rel="noreferrer"
          className="w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground"
        >
          Start WhatsApp Chat
        </a>
      </section>

      <div className="flex items-center gap-4 text-sm text-foreground/60">
        <div className="h-px flex-1 bg-primary/30" />
        <span>or reach us another way</span>
        <div className="h-px flex-1 bg-primary/30" />
      </div>

      <section className="flex flex-col gap-6 rounded-xl border border-primary/30 bg-card p-8">
        <h2 className="font-serif text-2xl text-foreground">Send us a message</h2>
        {sent && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="size-4" />
            Thanks — we&apos;ve received your message and will reply shortly.
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm text-foreground">
            Name
          </label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm text-foreground outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="contact" className="text-sm text-foreground">
            Email or Phone
          </label>
          <input
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm text-foreground">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-32 resize-y rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm text-foreground outline-none"
          />
        </div>
        <button className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground" onClick={handleSend}>
          Send Message
        </button>
      </section>

      <section className="flex flex-col gap-5 py-2">
        <div className="flex items-start gap-4">
          <Mail className="mt-1 size-5 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-foreground">Email</span>
            <span className="text-sm text-foreground/65">hello@tentvaale.com</span>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Phone className="mt-1 size-5 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-foreground">Phone</span>
            <span className="text-sm text-foreground/65">+91 22 4000 1234</span>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <MapPin className="mt-1 size-5 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-foreground">Studio Address</span>
            <span className="text-sm text-foreground/65">4th Floor, Kamala Mills, Lower Parel, Mumbai 400013</span>
          </div>
        </div>
      </section>
    </div>
  );
}
