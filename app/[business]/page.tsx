import { Storefront } from "../page";

export default async function BusinessStore({
  params,
}: {
  params: Promise<{ business: string }>;
}) {
  const { business } = await params;
  return <Storefront businessSlug={business} />;
}
