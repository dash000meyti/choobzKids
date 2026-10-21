import Link from "next/link";

/* Four quiet reassurance tiles, Apple "why buy here" style. */
const ITEMS = [
  { title: "چوب واقعی، نه نمای چوب", body: "تختهٔ چندلای توس، با لبه‌های لایه‌لایهٔ طبیعی که از دور هم پیداست.", href: "/safety", link: "جنس و ایمنی" },
  { title: "۴ قسط با اسنپ‌پی", body: "یک‌چهارم امروز، بقیه در سه ماه؛ طبق شرایط اسنپ‌پی.", href: "/installments", link: "خرید قسطی" },
  { title: "ارسال به سراسر ایران", body: "بسته‌بندی محکم و قابل‌پیگیری، تا در خانهٔ شما.", href: "/shipping", link: "ارسال و تحویل" },
  { title: "پشتیبانی از خودِ کارگاه", body: "قبل و بعد از خرید، سؤال‌هایتان را مستقیم از سازنده بپرسید.", href: "/contact", link: "تماس با ما" },
];

export function WhyChoobz() {
  return (
    <section aria-labelledby="why-title" className="mx-auto max-w-[75rem] px-gutter py-section">
      <h2 id="why-title" className="headline text-center text-2xl lg:text-[3.25rem]">
        چرا چوبز؟
      </h2>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <li key={it.title} className="reveal flex flex-col rounded-[1.75rem] bg-surface p-7">
            <h3 className="text-lg font-extrabold leading-snug">{it.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted">{it.body}</p>
            <Link href={it.href} className="link-arrow mt-5 text-sm">
              {it.link}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
