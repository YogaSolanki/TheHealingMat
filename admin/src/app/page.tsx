import { ApiStatus } from "@/components/api-status";

export default function AdminHome() {
  return (
    <div className="flex min-h-full bg-[#f3f1ec]">
      <aside className="flex w-60 flex-col border-r border-[#e2e5de] bg-[#243028] px-5 py-6 text-[#e8eee6]">
        <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#b7c6b3]">
          The Healing Mat
        </p>
        <p className="mt-1 text-sm text-[#8fa08c]">Admin</p>
        <nav className="mt-10 text-sm">
          <span className="block rounded-lg bg-white/10 px-3 py-2">
            Dashboard
          </span>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#e2e5de] bg-white px-8 py-4">
          <h1 className="text-lg font-medium">Dashboard</h1>
          <ApiStatus />
        </header>

        <main className="grid gap-4 p-8 sm:grid-cols-3">
          {[
            ["Storefront", "Next.js on :3000"],
            ["API", "Nest.js on :4000"],
            ["Database", "PostgreSQL on :5432"],
          ].map(([title, detail]) => (
            <section
              key={title}
              className="rounded-2xl border border-[#e2e5de] bg-white p-5"
            >
              <h2 className="text-sm text-[#6d7a6c]">{title}</h2>
              <p className="mt-2 text-lg font-medium">{detail}</p>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
