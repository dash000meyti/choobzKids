import Image from "next/image";
import type { FamilyPhotoData, ProductReviewData } from "@/db/queries/product";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StampBadge } from "@/components/ui/StampBadge";
import { toFaDigits } from "@/lib/format";
import { cn, fnv1a, mediaUrl } from "@/lib/utils";
import styles from "./ReviewsList.module.css";

/*
 * «نظر خانواده‌ها» (DESIGN.md §6.3 block 18, SEO.md §3.5.10). Approved reviews with the child's
 * age, the city and a «خرید تأییدشده» stamp when the purchase is verified, plus consented family
 * photos of this product as polaroids with a placard. Seed samples only reach this component
 * outside production (getProductPage) and always carry «نمونه». The average shows only with at
 * least three real reviews; sample reviews never count and never become schema.org Review.
 * Empty: the permanent frame «این قاب، منتظرِ شماست.»
 */

type ReviewsListProps = {
  reviews: ProductReviewData[];
  photos: FamilyPhotoData[];
  className?: string;
};

const faDecimal = (value: number) => toFaDigits(String(value)).replace(".", "٫");

function Stars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`امتیاز ${toFaDigits(rating)} از ۵`} className="inline-flex gap-0.5 text-ink">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" className={cn("size-4", i < rating ? "fill-current" : "opacity-30")} />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: ProductReviewData }) {
  const meta = [review.authorName, review.city, review.childAge ? `برای کودک ${review.childAge}` : null].filter(Boolean);
  return (
    <article className="flex h-full flex-col gap-3 rounded-bit bg-raised p-5 shadow-paper">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        {review.isSample ? <SampleBadge /> : review.verifiedPurchase ? <StampBadge tone="success">خرید تأییدشده</StampBadge> : null}
      </div>
      {review.title ? <h3 className="text-base font-bold text-ink">{review.title}</h3> : null}
      <p className="text-base text-ink">{review.body}</p>
      {review.image?.width && review.image.height ? (
        <Image
          src={mediaUrl(review.image.path)}
          width={review.image.width}
          height={review.image.height}
          alt={review.image.alt}
          sizes="(min-width: 1024px) 20vw, 50vw"
          quality={75}
          loading="lazy"
          className="aspect-square w-32 rounded-bit-sm object-cover"
        />
      ) : null}
      <p className="mt-auto text-xs text-muted">{meta.join(" · ")}</p>
    </article>
  );
}

function Polaroid({ photo }: { photo: FamilyPhotoData }) {
  const { image } = photo;
  if (!image.width || !image.height) return null;
  // A slight, stable tilt per photo (never random at render time).
  const tilt = (fnv1a(String(photo.id)) % 5) - 2;
  return (
    <figure className={styles.polaroid} style={{ rotate: `${tilt}deg` }}>
      <Image
        src={mediaUrl(image.path)}
        width={image.width}
        height={image.height}
        alt={image.alt}
        sizes="(min-width: 1024px) 15vw, 40vw"
        quality={75}
        loading="lazy"
        className="aspect-square w-full object-cover"
      />
      <figcaption className="flex flex-col gap-0.5 pt-2 text-xs text-ink">
        {photo.caption ? <span>{photo.caption}</span> : null}
        <span className="text-muted">{[photo.customerName, photo.city].filter(Boolean).join(" · ")}</span>
        {photo.isSample ? <SampleBadge className="mt-1 self-start" /> : null}
      </figcaption>
    </figure>
  );
}

export function ReviewsList({ reviews, photos, className }: ReviewsListProps) {
  const real = reviews.filter((r) => !r.isSample);
  const average = real.length >= 3 ? Math.round((real.reduce((sum, r) => sum + r.rating, 0) / real.length) * 10) / 10 : null;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader
        id="reviews-title"
        size="content"
        title="نظر خانواده‌ها"
        sub={
          average !== null
            ? `${faDecimal(average)} از ۵، بر اساس ${toFaDigits(real.length)} نظر خانواده‌هایی که خریده‌اند`
            : undefined
        }
      />

      {reviews.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : null}

      {photos.length ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {photos.map((photo) => (
            <Polaroid key={photo.id} photo={photo} />
          ))}
        </div>
      ) : null}

      {!reviews.length && !photos.length ? (
        <figure className={styles.emptyFrame}>
          <span aria-hidden="true" className={styles.emptyInner}>
            <Icon name="heart" className="size-7" />
          </span>
          <figcaption className="text-base font-semibold text-ink">این قاب، منتظرِ شماست.</figcaption>
          <p className="text-sm text-muted">اولین خانواده‌ای باشید که از تجربه‌اش با این وسیله می‌نویسد.</p>
        </figure>
      ) : null}
    </section>
  );
}
