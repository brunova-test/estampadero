import { CategoryShowcase } from "elestampadero/widgets/category-showcase";
import { ClubsShowcase } from "elestampadero/widgets/clubs-showcase";
import { FeaturedProducts } from "elestampadero/widgets/featured-products";
import { GraduatesCampaign } from "elestampadero/widgets/graduates-campaign";
import { HeroCarousel } from "elestampadero/widgets/hero-carousel";
import { InfoBlocks } from "elestampadero/widgets/info-blocks";
import { StoreFooter } from "elestampadero/widgets/store-footer";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { RevealOnScroll } from "elestampadero/shared/ui/motion";
import { api } from "elestampadero/trpc/server";

export async function HomeView() {
  const [publishedProducts, productsBySales] = await Promise.all([
    api.catalog.list({ sort: "NEWEST" }),
    api.catalog.list({ sort: "BEST_SELLING" }),
  ]);
  const newArrivals = [...publishedProducts].sort((left, right) => {
    const manualPriority = Number(right.isFeatured) - Number(left.isFeatured);
    return (
      manualPriority || right.createdAt.getTime() - left.createdAt.getTime()
    );
  });
  const printableProducts = publishedProducts.filter(
    (product) => product.allowsCustomPrint,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex flex-1 flex-col gap-4 pb-4 md:gap-[clamp(28px,3.4vw,64px)] md:pb-[clamp(28px,3.4vw,64px)]">
        {/* Above the fold: a plain fade, no travel, so nothing shifts on load. */}
        <RevealOnScroll direction="none" duration={0.5}>
          <HeroCarousel />
        </RevealOnScroll>
        <RevealOnScroll>
          <GraduatesCampaign />
        </RevealOnScroll>
        <RevealOnScroll>
          <InfoBlocks />
        </RevealOnScroll>
        <RevealOnScroll>
          <CategoryShowcase />
        </RevealOnScroll>
        <RevealOnScroll>
          <FeaturedProducts
            bestSellers={productsBySales.slice(0, 4)}
            newArrivals={newArrivals.slice(0, 4)}
            printableProducts={printableProducts.slice(0, 4)}
          />
        </RevealOnScroll>
        <RevealOnScroll>
          <ClubsShowcase />
        </RevealOnScroll>
      </main>
      <StoreFooter showAbout />
    </div>
  );
}
