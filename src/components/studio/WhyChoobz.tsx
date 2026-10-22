import type { ReactNode } from "react";
import Link from "@/components/ui/Link";

/*
 * «چرا چوبز؟» — four reassurance cards in the Apple "why buy here" manner: a fine line icon, a
 * plain promise, one sentence and a link to the page that backs it up. Every claim is one the
 * linked page states (no invented numbers).
 */

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className="size-12 text-ink" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ITEMS = [
  {
    title: "چوب واقعی، نه نمای چوب",
    body: "تختهٔ چندلای توس، با لبه‌های لایه‌لایهٔ طبیعی که از دور هم پیداست.",
    href: "/safety",
    link: "جنس و ایمنی",
    icon: (
      <Icon>
        <path d="M8 30 24 38l16-8" />
        <path d="M8 24 24 32l16-8" />
        <path d="M8 18 24 10l16 8-16 8-16-8Z" />
      </Icon>
    ),
  },
  {
    title: "۴ قسط با اسنپ‌پی",
    body: "یک‌چهارم امروز، بقیه در سه ماه؛ طبق شرایط اسنپ‌پی.",
    href: "/installments",
    link: "خرید قسطی",
    icon: (
      <Icon>
        <circle cx="24" cy="24" r="15" />
        <path d="M24 9v15h15" />
        <path d="M24 24 13.4 34.6" opacity=".45" />
      </Icon>
    ),
  },
  {
    title: "ارسال به سراسر ایران",
    body: "بسته‌بندی محکم و قابل‌پیگیری، تا در خانهٔ شما.",
    href: "/shipping",
    link: "ارسال و تحویل",
    icon: (
      <Icon>
        <path d="M24 6 40 14v20L24 42 8 34V14L24 6Z" />
        <path d="M8 14l16 8 16-8M24 22v20" />
        <path d="m16 10 16 8" opacity=".45" />
      </Icon>
    ),
  },
  {
    title: "پشتیبانی از خودِ کارگاه",
    body: "قبل و بعد از خرید، سؤال‌هایتان را مستقیم از سازنده بپرسید.",
    href: "/contact",
    link: "تماس با ما",
    icon: (
      <Icon>
        <path d="M10 12h28a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H22l-8 6v-6h-4a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z" />
        <path d="M17 22h14M17 27h8" opacity=".55" />
      </Icon>
    ),
  },
];

export function WhyChoobz() {
  return (
    <section aria-labelledby="why-title" className="frame-col frame-rule frame-pad py-band">
      <div className="reveal text-center">
        <p className="eyebrow">خرید با خیال راحت</p>
        <h2 id="why-title" className="headline mt-2 text-[2.25rem] lg:text-[3.5rem]">
          چرا چوبز؟
        </h2>
      </div>
      <ul className="reveal cells mt-12 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <li key={it.title}>
            <Link
              href={it.href}
              className="cell-hover group flex h-full flex-col p-8 lg:p-9"
            >
              {it.icon}
              <h3 className="mt-8 text-[1.375rem] leading-snug font-bold">{it.title}</h3>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-7 text-muted">{it.body}</p>
              <span className="link-arrow mt-6 text-[0.9375rem]">{it.link}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
