import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/db/queries/settings";
import { AGE_STAGES } from "@/lib/ages";
import { toFaDigits } from "@/lib/format";
import { AgeBadge } from "@/components/ui/AgeBadge";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Bubble } from "@/components/ui/Bubble";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Doodle, DOODLE_NAMES } from "@/components/ui/Doodle";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import { Field } from "@/components/ui/Field";
import { HexChip } from "@/components/ui/HexChip";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { InstallmentBadge } from "@/components/ui/InstallmentBadge";
import { InstallmentLine } from "@/components/ui/InstallmentLine";
import { InstallmentWheels } from "@/components/ui/InstallmentWheels";
import { IntentLink } from "@/components/ui/IntentLink";
import { Kashida } from "@/components/ui/Kashida";
import { Kicker } from "@/components/ui/Kicker";
import { KraftTag } from "@/components/ui/KraftTag";
import { Mark } from "@/components/ui/Mark";
import { PillChip } from "@/components/ui/PillChip";
import { Price } from "@/components/ui/Price";
import { Radio } from "@/components/ui/Radio";
import { RemovableChip } from "@/components/ui/RemovableChip";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetClose, sheetInvokerProps } from "@/components/ui/Sheet";
import { Stage } from "@/components/ui/Stage";
import { StampBadge } from "@/components/ui/StampBadge";
import { Stepper } from "@/components/ui/Stepper";
import { StepperControl } from "@/components/ui/StepperControl";
import { StockBadge } from "@/components/ui/StockBadge";
import { TextInput } from "@/components/ui/TextInput";
import { Toggle } from "@/components/ui/Toggle";
import styles from "./kit.module.css";

/*
 * Dev-only showcase of every ui/ primitive in all variants and states, rendered twice: on the
 * light tokens and on the «لالایی» dark tokens. 404s in production; never indexed.
 */

export const metadata: Metadata = {
  title: "کیت رابط کاربری",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/* Demo settings shaped like the real ones. Placeholder hrefs never point at a real channel. */
const SNAPPPAY: SiteSettings["snapppay"] = { enabled: true, count: 4, minToman: null, maxToman: null };
const SNAPPPAY_RANGE: SiteSettings["snapppay"] = { enabled: true, count: 4, minToman: 1_000_000, maxToman: 50_000_000 };
const SOCIALS_SEED: SiteSettings["socials"] = {
  instagram: "https://www.instagram.com/choobz.kids/",
  instagramHandle: "choobz.kids",
  bale: null,
  aparat: null,
  followers: null,
  followersAsOf: null,
};
const SOCIALS_BOTH: SiteSettings["socials"] = { ...SOCIALS_SEED, bale: "#kit-bale" };
const ENAMAD_DEMO: SiteSettings["enamad"] = {
  id: "demo",
  code: "demo",
  href: "#kit-enamad",
  imgSrc:
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 92"><rect x="1" y="1" width="83" height="90" rx="8" fill="#F4EBDC" stroke="#8A7666" stroke-dasharray="4 3"/><circle cx="42.5" cy="40" r="18" fill="none" stroke="#8A7666" stroke-width="2"/></svg>',
    ),
};

const BUTTON_VARIANTS: { variant: Exclude<ButtonVariant, "icon">; label: string }[] = [
  { variant: "primary", label: "افزودن به سبد" },
  { variant: "secondary", label: "برای سنِ بچه‌م چی خوبه؟" },
  { variant: "wood", label: "بیشتر نشونم بده" },
  { variant: "consult", label: "سؤال داری؟ در بله بپرس" },
  { variant: "quiet", label: "همه ←" },
];

function Latin({ children }: { children: ReactNode }) {
  return (
    <bdi lang="en" dir="ltr" className="font-mono text-2xs text-muted">
      {children}
    </bdi>
  );
}

function Block({ title, name, children }: { title: string; name: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-line pt-8">
      <h2 className="flex flex-wrap items-baseline gap-x-3 text-xl font-bold text-ink">
        {title} <Latin>{name}</Latin>
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <p className="text-xs font-semibold text-muted">{label}</p> : null}
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

function Showcase({ prefix }: { prefix: string }) {
  const id = (name: string) => `${prefix}-${name}`;
  return (
    <div className="flex flex-col gap-10">
      <Block title="نشانه‌ها" name="Icon · /icons.svg">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
          {ICON_NAMES.map((name) => (
            <div key={name} className={styles.swatch}>
              <Icon name={name} className="size-6 text-ink" />
              <Latin>{name}</Latin>
            </div>
          ))}
        </div>
        <Row label="اندازه و رنگ از والد">
          <Icon name="cart" className="size-4" />
          <Icon name="cart" className="size-6 text-accent" />
          <Icon name="cart" className="size-10 text-success" />
          <Icon name="arrow-end" className="size-6" title="بعدی" />
        </Row>
      </Block>

      <Block title="دست مادر" name="Doodle · /marks.svg">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
          {DOODLE_NAMES.map((name) => (
            <div key={name} className={styles.swatch}>
              <Doodle name={name} className="h-8 w-auto" />
              <Latin>{name}</Latin>
            </div>
          ))}
        </div>
        <Row label="رنگ‌ها">
          <Doodle name="sprout" />
          <Doodle name="heart" tone="accent" />
          <Doodle name="sparkle" tone="success" />
        </Row>
      </Block>

      <Block title="دکمه‌ها" name="Button">
        {BUTTON_VARIANTS.map(({ variant, label }) => (
          <Row key={variant} label={variant}>
            <Button variant={variant} size="sm">
              {label}
            </Button>
            <Button variant={variant}>{label}</Button>
            <Button variant={variant} size="lg">
              {label}
            </Button>
            <Button variant={variant} iconStart="cart">
              با نشانه
            </Button>
            <Button variant={variant} loading>
              در حال افزودن
            </Button>
            <Button variant={variant} disabled>
              غیرفعال
            </Button>
            <Button variant={variant} href="/shop" iconEnd="arrow-end">
              پیوند
            </Button>
          </Row>
        ))}
        <Row label="aria-pressed">
          <Button variant="wood" aria-pressed="true">
            انتخاب‌شده
          </Button>
          <Button variant="wood" aria-pressed="false">
            انتخاب‌نشده
          </Button>
          <Button variant="primary" block>
            تمام‌عرض (block)
          </Button>
        </Row>
      </Block>

      <Block title="دکمهٔ گرد" name="IconButton">
        <Row label="raised · wood · accent در سه اندازه">
          {(["raised", "wood", "accent"] as const).map((tone) =>
            (["sm", "md", "lg"] as const).map((size) => (
              <IconButton key={`${tone}-${size}`} icon={tone === "accent" ? "plus" : "close"} label="نمونه" tone={tone} size={size} />
            )),
          )}
          <IconButton icon="trash" label="حذف" disabled />
          <IconButton icon="share" label="هم‌رسانی" href="#kit-share" />
        </Row>
      </Block>

      <Block title="ورودی‌ها" name="Field · TextInput · Select">
        <div className="grid gap-6 md:grid-cols-2">
          <Field id={id("name")} label="اسم کوچولوت چیه؟" hint="این اسم فقط روی گوشی خودت می‌مونه.">
            {(control) => <TextInput {...control} placeholder="مثلاً آیلین" />}
          </Field>
          <Field id={id("phone")} label="شمارهٔ موبایل" required error="شماره باید ۱۱ رقم باشد.">
            {(control) => <TextInput {...control} numeric autoComplete="tel" defaultValue="۰۹۱۲" />}
          </Field>
          <Field id={id("city")} label="شهر" optional>
            {(control) => (
              <Select {...control} defaultValue="tehran">
                <option value="tehran">تهران</option>
                <option value="isfahan">اصفهان</option>
                <option value="tabriz">تبریز</option>
              </Select>
            )}
          </Field>
          <Field id={id("disabled")} label="غیرفعال">
            {(control) => <TextInput {...control} disabled defaultValue="قابل ویرایش نیست" />}
          </Field>
        </div>
      </Block>

      <Block title="انتخاب‌ها" name="Checkbox · Radio · Toggle">
        <Row label="Checkbox">
          <Checkbox name={id("c")} label="پیش‌فرض" />
          <Checkbox name={id("c")} label="تیک‌خورده" defaultChecked />
          <Checkbox name={id("c")} label="با توضیح" hint="یک خط توضیح کوتاه" />
          <Checkbox name={id("c")} label="غیرفعال" disabled />
        </Row>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold text-muted">Radio</legend>
          <div className="flex flex-wrap gap-4">
            <Radio name={id("finish")} value="natural" label="طبیعی" defaultChecked />
            <Radio name={id("finish")} value="white" label="سفید" />
            <Radio name={id("finish")} value="other" label="غیرفعال" disabled />
          </div>
        </fieldset>
        <Row label="Toggle">
          <Toggle label="حرکت آرام" />
          <Toggle label="روشن" defaultChecked />
          <Toggle label="غیرفعال" disabled />
          <Toggle label="برچسب اول" labelFirst defaultChecked />
        </Row>
      </Block>

      <Block title="شمارنده" name="Stepper · StepperControl">
        <Row label="ایستا (سرور) · کمینه · بیشینه · کوچک">
          <Stepper label="تعداد" value={2} />
          <Stepper label="تعداد" value={1} />
          <Stepper label="تعداد" value={9} max={9} />
          <Stepper label="تعداد" value={3} size="sm" />
        </Row>
        <Row label="تعاملی (نگه‌داشتن = تکرار)">
          <StepperControl label="تعداد برج یادگیری" defaultValue={1} max={10} name={id("qty")} />
        </Row>
      </Block>

      <Block title="تراشه‌ها" name="HexChip · PillChip · RemovableChip">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold text-muted">HexChip · radio با رنگ هر سن</legend>
          <div className="flex flex-wrap gap-3">
            {AGE_STAGES.map((stage, index) => (
              <HexChip key={stage.key} name={id("age")} value={stage.key} tint={stage.key} defaultChecked={index === 2}>
                <Kashida trigger="checked">{stage.label}</Kashida>
              </HexChip>
            ))}
          </div>
        </fieldset>
        <Row label="HexChip · toggle">
          <HexChip pressed={false}>۱ تا ۳ سال</HexChip>
          <HexChip pressed>۳ تا ۶ سال</HexChip>
          <HexChip pressed={false} tint="sage">
            مونته‌سوری
          </HexChip>
          <HexChip pressed={false} disabled aria-disabled="true">
            غیرفعال
          </HexChip>
        </Row>
        <Row label="PillChip">
          <PillChip pressed={false}>تعادل</PillChip>
          <PillChip pressed>استقلال</PillChip>
          <PillChip icon="sprout" pressed={false}>
            حرکتی درشت
          </PillChip>
          <PillChip href="/shop/climbing" current>
            صعود (صفحهٔ فعلی)
          </PillChip>
          <PillChip href="/shop/toys">اسباب‌بازی</PillChip>
          <PillChip disabled>غیرفعال</PillChip>
        </Row>
        <Row label="RemovableChip">
          <RemovableChip label="۱ تا ۲ سال" />
          <RemovableChip label="موجود" />
          <Button variant="quiet" size="sm">
            پاک‌کردن همه
          </Button>
        </Row>
      </Block>

      <Block title="نشان‌ها" name="AgeBadge · StampBadge · InstallmentBadge · StockBadge · SampleBadge">
        <Row label="AgeBadge">
          <AgeBadge min={18} />
          <AgeBadge min={18} max={60} />
          <AgeBadge min={6} max={12} />
          <AgeBadge min={0} max={6} />
          <AgeBadge min={36} max={96} link />
        </Row>
        <Row label="StampBadge">
          <StampBadge>جدید</StampBadge>
          <StampBadge tone="ink">ساخت سفارشی</StampBadge>
          <StampBadge tone="success">پیشنهاد یلدا</StampBadge>
        </Row>
        <Row label="InstallmentBadge">
          <InstallmentBadge price={9_800_000} snapppay={SNAPPPAY} />
        </Row>
        <Row label="StockBadge · کوتاه">
          <StockBadge availability="in_stock" />
          <StockBadge availability="made_to_order" leadTimeDays={14} />
          <StockBadge availability="preorder" />
          <StockBadge availability="out_of_stock" />
        </Row>
        <Row label="StockBadge · بلند">
          <StockBadge availability="made_to_order" leadTimeDays={14} variant="long" />
          <StockBadge availability="out_of_stock" variant="long" />
        </Row>
        <Row label="SampleBadge · KraftTag">
          <SampleBadge />
          <KraftTag>شناسنامهٔ این محصول</KraftTag>
          <KraftTag string={false}>بدون نخ</KraftTag>
        </Row>
      </Block>

      <Block title="قیمت و اقساط" name="Price · InstallmentLine · InstallmentWheels">
        <Row label="Price">
          <Price price={9_800_000} size="sm" />
          <Price price={9_800_000} />
          <Price price={36_500_000} compareAt={38_100_000} size="lg" />
          <Price price={2_400_000} from />
        </Row>
        <div className="flex flex-col gap-2">
          <InstallmentLine price={9_800_000} snapppay={SNAPPPAY} />
          <InstallmentLine price={9_800_000} snapppay={SNAPPPAY} link={false} />
          <InstallmentLine price={6_900_000} snapppay={SNAPPPAY} variant="pdp" />
          <InstallmentLine price={6_900_000} snapppay={SNAPPPAY} variant="pdp" approximate />
          <div className="text-xs text-muted">
            خارج از بازهٔ مجاز اسنپ‌پی (چیزی نمایش داده نمی‌شود):
            <InstallmentLine price={600_000} snapppay={SNAPPPAY_RANGE} />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <InstallmentWheels total={35_000_000} snapppay={SNAPPPAY} />
          <InstallmentWheels total={9_800_000} snapppay={SNAPPPAY} wheelSize={24} approximate finePrint={false} />
        </div>
      </Block>

      <Block title="صحنه" name="Stage">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stage kind="illustration" illustration="learning-tower" slug="learning-tower" alt="برج یادگیری، نمای سرهم" />
          <div className="group">
            <Stage
              kind="illustration"
              illustration="pikler-triangle"
              hoverView="exploded"
              slug="pikler-triangle"
              alt="مثلث پیکلر، نمای سرهم"
            >
              <StampBadge className="absolute end-3 top-4">جدید</StampBadge>
            </Stage>
            <p className="mt-2 text-xs text-muted">با نشانگر: نمای انفجاری</p>
          </div>
          <Stage kind="illustration" illustration="duck-pull-toy" slug="duck-pull-toy" alt="اردک چرخ‌دار" />
          <Stage kind="illustration" illustration="balance-board" slug="balance-board" alt="تختهٔ تعادل" />
        </div>
        <p className="text-xs text-muted">
          نوع‌های <Latin>cutout</Latin> و <Latin>photo</Latin> با <Latin>next/image</Latin> از <Latin>/media</Latin> بارگذاری
          می‌شوند و در دادهٔ نمونه عکسی ندارند.
        </p>
      </Block>

      <Block title="سرتیتر بخش" name="SectionHeader · Kicker · Mark · Kashida">
        <SectionHeader
          kicker="یه راهنمای کوچیک"
          kickerDoodle="sprout"
          kickerTone="success"
          title={
            <>
              برای سنِ بچه‌م <Mark>چی</Mark> خوبه؟
            </>
          }
          sub="از چهار ماهگی تا شش سالگی، وسایلی که با بچه بزرگ می‌شن."
          link={{ label: "همه ←", href: "/age" }}
        />
        <SectionHeader size="content" title="برج یادگیری چیست و از چه سنی مناسب است؟" sub="پاسخ کوتاه در چهل تا شصت کلمه." />
        <SectionHeader kicker="فصل یکم · بازی" kickerDecorative title="بازی" plyType swash />
        <SectionHeader
          align="center"
          kicker="قصهٔ ما به سر رسید…"
          title={
            <>
              …ولی اردکه به خونه‌تون <Kashida trigger="view">رسید</Kashida>!
            </>
          }
        />
        <Row label="Kicker">
          <Kicker>یکی بود، یکی نبود…</Kicker>
          <Kicker tone="success" doodle="sparkle">
            امروز در کارگاه
          </Kicker>
          <Kicker tone="muted">آرام و بی‌عجله</Kicker>
        </Row>
        <Row label="Kashida · hover / none">
          <span className="group inline-flex items-center gap-2 rounded-bit-sm bg-raised px-4 py-2 shadow-ply">
            <Kashida trigger="hover">تاتی</Kashida>
          </span>
          <Kashida trigger="none" stretch={180}>
            کشیده
          </Kashida>
        </Row>
      </Block>

      <Block title="حباب، برچسب، پرسش" name="Bubble · KraftTag · AskChoobz · EnamadBadge">
        <div className="grid gap-6 md:grid-cols-2">
          <Bubble>«بچه‌م فقط ۱۴ ماهشه؛ برج یادگیری براش زوده؟»</Bubble>
          <Bubble size="lg" as="aside">
            <p className="font-bold">خلاصه</p>
            <p className="text-sm">برج یادگیری از وقتی بچه محکم می‌ایسته کاربرد داره.</p>
          </Bubble>
          <AskChoobz socials={SOCIALS_SEED} />
          <AskChoobz socials={SOCIALS_BOTH} hours="نمونهٔ ساعت پاسخ‌گویی" />
          <AskChoobz socials={SOCIALS_BOTH} compact />
        </div>
        <Row label="EnamadBadge (null → هیچ · نمونهٔ جای‌نگهدار)">
          <EnamadBadge enamad={null} />
          <EnamadBadge enamad={ENAMAD_DEMO} />
        </Row>
      </Block>

      <Block title="برگهٔ کشویی" name="Sheet">
        <Row>
          <Button variant="secondary" iconStart="filter" {...sheetInvokerProps(id("sheet"))}>
            فیلترها
          </Button>
          <Button variant="secondary" {...sheetInvokerProps(id("sheet-start"))}>
            کشو از سمت آغاز
          </Button>
        </Row>
        <Sheet
          id={id("sheet")}
          title="فیلترها"
          description="روی موبایل از پایین، روی دسکتاپ از کنار باز می‌شود."
          footer={
            <div className="flex gap-3">
              <SheetClose variant="primary" block>
                دیدن ۱۲ محصول
              </SheetClose>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Checkbox name={id("s1")} label="فقط موجودها" />
            <Toggle label="ساخت سفارشی" />
            <div className="flex flex-wrap gap-2">
              <PillChip pressed>تعادل</PillChip>
              <PillChip pressed={false}>خلاقیت</PillChip>
            </div>
            {Array.from({ length: 12 }, (_, index) => (
              <p key={index} className="text-sm text-muted">
                محتوای قابل پیمایش · ردیف {toFaDigits(index + 1)}
              </p>
            ))}
          </div>
        </Sheet>
        <Sheet id={id("sheet-start")} side="start" title="منو">
          <p>این کشو در دسکتاپ از سمت آغاز (راست) باز می‌شود.</p>
        </Sheet>
      </Block>

      <Block title="پیوند با نیت" name="IntentLink">
        <IntentLink href="/shop" className="link-mark self-start">
          فروشگاه (پیش‌بارگذاری کامل با نشانگر یا فوکوس)
        </IntentLink>
      </Block>
    </div>
  );
}

export default function KitPage() {
  if (process.env.CHOOBZ_ENV === "production") notFound();
  return (
    <main id="main" className="mx-auto flex max-w-page flex-col gap-10 px-gutter py-12">
      <header className="flex flex-col gap-2">
        <Kicker tone="muted">فقط برای توسعه</Kicker>
        <h1 className="font-display text-3xl">کیت رابط کاربری چوبز</h1>
        <p className="max-w-prose text-muted">
          همهٔ اجزای <Latin>components/ui</Latin> در همهٔ حالت‌ها، یک بار روی توکن‌های روشن و یک بار روی «لالایی».
        </p>
      </header>
      <div className={`${styles.panel} ${styles.light}`} data-theme="light">
        <Showcase prefix="light" />
      </div>
      <div className={`${styles.panel} ${styles.dark}`} data-theme="dark">
        <Showcase prefix="dark" />
      </div>
    </main>
  );
}
