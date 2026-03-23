import { Link } from "react-router-dom";

export default function InfoPage({ title, description }) {
  return (
    <main className="pt-[92px] min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-12 lg:py-16">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-brand-border bg-white p-8 lg:p-12 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-muted mb-3">
            Vendly
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight mb-4">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-brand-muted max-w-2xl">
            {description}
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-brand-charcoal bg-brand-charcoal text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-dark transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
