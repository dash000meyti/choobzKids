import { FeaturedShelf } from "@/components/home/FeaturedShelf";
import { NameEngraver } from "@/components/home/NameEngraver";
import { Notebook } from "@/components/home/Notebook";
import { Workshop } from "@/components/home/Workshop";
import { PageTurn } from "@/components/layout/PageTurn";

export default function HomePage() {
  return (
    <PageTurn>
      <FeaturedShelf />
      <Notebook />
      <Workshop />
      <NameEngraver />
    </PageTurn>
  );
}
