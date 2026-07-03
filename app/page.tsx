import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "VVIP Hospitality | Premium Stays & Bakery Services",
  description:
    "VVIP Hospitality runs Olive Stayz, a premium long-stay & medical-tourism accommodation in Kaushambi, Ghaziabad, and Swiss Affaire - The Bake Studio, a B2B cloud kitchen supplying gourmet baked goods to cafes and restaurants.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomeClient />;
}
