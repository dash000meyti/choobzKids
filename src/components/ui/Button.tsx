import Link from "@/components/ui/Link";
import type { ButtonHTMLAttributes, ComponentProps, CSSProperties, ReactNode } from "react";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

/*
 * Buttons (DESIGN.md §4.8). Server-safe: no hooks, no client directive, so it renders inside
 * Server and Client Components alike. With `href` it renders a next/link (or a plain <a> for
 * external, hash, tel: and mailto: targets); otherwise a <button type="button">.
 * Raised pieces sit on a laminated ply edge and press 2px into it; `quiet` is flat text.
 */

export type ButtonVariant = "primary" | "secondary" | "wood" | "quiet" | "consult" | "icon";
export type ButtonSize = "sm" | "md" | "lg";
/** Face of the round `icon` variant. */
export type IconButtonTone = "raised" | "wood" | "accent";

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label (inline-start). */
  iconStart?: IconName;
  /** Icon after the label (inline-end). */
  iconEnd?: IconName;
  /** Sets aria-busy and shows three pulsing beads after the label. */
  loading?: boolean;
  /** Full width at every breakpoint (`lg` is already full width on phones). */
  block?: boolean;
  /** Only for `variant="icon"`. */
  tone?: IconButtonTone;
  /** Seed for the wood grain board on `variant="wood"` (e.g. a slug). */
  grainSeed?: string;
  className?: string;
  children?: ReactNode;
};

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;
type NativeLinkProps = Omit<ComponentProps<typeof Link>, keyof ButtonOwnProps | "href">;

export type ButtonAsButton = ButtonOwnProps & NativeButtonProps & { href?: undefined };
export type ButtonAsLink = ButtonOwnProps &
  NativeLinkProps & {
    href: string;
    /** Renders a non-navigating, aria-disabled anchor. */
    disabled?: boolean;
  };
export type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE =
  "relative inline-flex shrink-0 items-center justify-center gap-2 select-none whitespace-nowrap font-semibold " +
  "aria-disabled:cursor-not-allowed aria-busy:cursor-progress";

/* Hover only fires on hover-capable devices (Tailwind's `hover:` is gated on `(hover: hover)`). */
const PRESS =
  "not-aria-disabled:active:translate-y-0.5 not-aria-disabled:active:shadow-ply-pressed " +
  "aria-pressed:translate-y-0.5 aria-pressed:shadow-ply-pressed";

const DISABLED = "aria-disabled:bg-wood aria-disabled:text-muted aria-disabled:shadow-none aria-disabled:border-transparent";

const VARIANT: Record<Exclude<ButtonVariant, "icon">, string> = {
  primary: cn(
    "rounded-bit-sm bg-accent text-on-accent shadow-ply",
    "not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--accent),white_6%)] not-aria-disabled:active:bg-accent-press",
    PRESS,
    DISABLED,
  ),
  secondary: cn(
    "rounded-bit-sm border-[1.5px] border-line-strong bg-raised text-ink shadow-ply",
    "not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--surface-raised),white_6%)]",
    PRESS,
    DISABLED,
  ),
  wood: cn(
    "grain rounded-bit-sm bg-wood text-ink shadow-ply",
    "not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--surface),var(--ink)_5%)]",
    PRESS,
    DISABLED,
  ),
  consult: cn(
    "rounded-bit-sm border-[1.5px] border-success bg-raised text-success shadow-ply",
    "not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--surface-raised),white_6%)]",
    PRESS,
    DISABLED,
  ),
  quiet: "rounded-bit-xs text-ink aria-disabled:text-muted",
};

const ICON_TONE: Record<IconButtonTone, string> = {
  raised: "bg-raised text-ink not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--surface-raised),white_6%)]",
  wood: "bg-wood text-ink not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--surface),var(--ink)_5%)]",
  accent:
    "bg-accent text-on-accent not-aria-disabled:hover:bg-[color-mix(in_oklab,var(--accent),white_6%)] not-aria-disabled:active:bg-accent-press",
};

/* sm is 40px tall; the ::after pad brings the hit area to 44px (WCAG 2.5.8). */
const HIT_PAD = "after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']";

const SIZE: Record<ButtonSize, string> = {
  sm: cn("h-10 px-4 text-sm", HIT_PAD),
  md: "h-12 px-5 text-base",
  lg: "h-14 px-7 text-base max-sm:w-full",
};

const QUIET_SIZE: Record<ButtonSize, string> = {
  sm: "min-h-11 px-1 text-sm",
  md: "min-h-11 px-1 text-base",
  lg: "min-h-12 px-1 text-lead",
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: cn("size-10 [&>svg]:size-5", HIT_PAD, "after:-inset-x-0.5"),
  md: "size-11 [&>svg]:size-6",
  lg: "size-12 [&>svg]:size-6",
};

/** The button look for elements Button cannot render itself (e.g. a <label> or <summary>). */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  tone = "raised",
  block,
  className,
}: Pick<ButtonOwnProps, "variant" | "size" | "tone" | "block" | "className"> = {}) {
  const look =
    variant === "icon"
      ? cn("rounded-bead p-0 shadow-ply", ICON_TONE[tone], ICON_SIZE[size], PRESS, DISABLED)
      : cn(VARIANT[variant], variant === "quiet" ? QUIET_SIZE[size] : SIZE[size]);
  return cn(BASE, styles.button, look, block && "w-full", className);
}

const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

function Beads() {
  return (
    <span className={styles.beads} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ButtonContent({ variant, iconStart, iconEnd, loading, children }: ButtonOwnProps) {
  return (
    <>
      {iconStart ? <Icon name={iconStart} /> : null}
      {children != null ? <span className={variant === "quiet" ? "link-mark" : undefined}>{children}</span> : null}
      {iconEnd ? <Icon name={iconEnd} /> : null}
      {loading ? <Beads /> : null}
    </>
  );
}

function faceStyle(variant: ButtonVariant, grainSeed: string | undefined, style: CSSProperties | undefined) {
  if (variant !== "wood") return style;
  return { ...(grainStyle(grainSeed ?? "button") as CSSProperties), ...style };
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) return <ButtonLink {...props} />;
  const {
    variant = "secondary",
    size = "md",
    tone,
    iconStart,
    iconEnd,
    loading,
    block,
    grainSeed,
    className,
    children,
    disabled,
    style,
    type = "button",
    ...rest
  } = props;
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, tone, block, className })}
      style={faceStyle(variant, grainSeed, style)}
    >
      <ButtonContent variant={variant} iconStart={iconStart} iconEnd={iconEnd} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}

function ButtonLink(props: ButtonAsLink) {
  const {
    variant = "secondary",
    size = "md",
    tone,
    iconStart,
    iconEnd,
    loading,
    block,
    grainSeed,
    className,
    children,
    disabled,
    style,
    href,
    prefetch,
    replace,
    scroll,
    onNavigate,
    transitionTypes,
    ...anchor
  } = props;
  const shared = {
    className: buttonClasses({ variant, size, tone, block, className }),
    style: faceStyle(variant, grainSeed, style),
    "aria-busy": loading || undefined,
  };
  const content = (
    <ButtonContent variant={variant} iconStart={iconStart} iconEnd={iconEnd} loading={loading}>
      {children}
    </ButtonContent>
  );

  if (disabled) {
    return (
      <a {...anchor} {...shared} role="link" aria-disabled="true">
        {content}
      </a>
    );
  }
  if (EXTERNAL.test(href)) {
    return (
      <a {...anchor} {...shared} href={href}>
        {content}
      </a>
    );
  }
  return (
    <Link
      {...anchor}
      {...shared}
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      onNavigate={onNavigate}
      transitionTypes={transitionTypes}
    >
      {content}
    </Link>
  );
}
