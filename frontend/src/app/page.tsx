import { ApiStatus } from "@/components/api-status";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[#f6f3ee]">
      <header className="flex items-center justify-between px-8 py-6">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#4d6b58]">
          The Healing Mat
        </p>
        <ApiStatus />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-8 pb-24">
        <p className="mb-4 text-sm tracking-[0.18em] uppercase text-[#6d8474]">
          Frontend
        </p>
        <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight text-[#1f2a24]">
          Restorative wellness, grounded in care.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-[#4f5d54]">
          Next.js storefront is ready. The Nest.js API and PostgreSQL database
          are wired through the health check in the header.
        </p>
      </main>
    </div>
  );
}
