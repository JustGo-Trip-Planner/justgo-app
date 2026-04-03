import axios from "axios";
import config from "../config";

type SearchHotelsParams = {
  q: string;
  province: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  currency?: string;
  provinceLat?: string;
  provinceLng?: string;
};

export type HotelItem = {
  _localId: string;
  name: string;
  type?: string;
  stars?: number;
  price_per_night: number;
  price_text?: string;
  rating?: number;
  review_count?: number;
  address?: string;
  image?: string;
  website_url?: string;
  google_hotels_url?: string;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  lat?: number;
  lng?: number;
  description?: string;
  source?: string;
};

const SERPAPI_URL = "https://serpapi.com/search.json";

function toNumber(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPriceText(price: number, currency = "THB") {
  if (!price || price <= 0) return "";
  if (currency === "THB") {
    return `฿${price.toLocaleString("th-TH")}/คืน`;
  }
  return `${currency} ${price.toLocaleString("th-TH")}/คืน`;
}

function buildAddress(property: any, province: string) {
  const direct =
    property?.address ||
    property?.location ||
    property?.formatted_address ||
    "";

  if (direct && String(direct).trim()) {
    return String(direct).trim();
  }

  return province || "";
}

function buildGoogleHotelsUrl(
  property: any,
  province: string,
  address: string
) {
  const queryParts = [
    property?.name || "",
    address || "",
    province || "",
    "hotel",
  ].filter(Boolean);

  const query = queryParts.join(" ");
  return `https://www.google.com/travel/hotels?q=${encodeURIComponent(query)}`;
}

function mapProperty(property: any, province: string, currency = "THB"): HotelItem {
  const extractedPrice =
    property?.rate_per_night?.extracted_lowest ??
    property?.prices?.[0]?.rate_per_night?.extracted_lowest ??
    0;

  const price = toNumber(extractedPrice, 0);

  const reviewValue =
    property?.overall_rating ??
    property?.reviews ??
    property?.rating ??
    0;

  const reviewCount =
    property?.reviews_count ??
    property?.reviews_total ??
    0;

  const image =
    property?.images?.[0]?.original_image ||
    property?.images?.[0]?.thumbnail ||
    property?.thumbnail ||
    "";

  const stars = toNumber(
    property?.extracted_hotel_class ?? property?.hotel_class,
    0
  );

  const lat = property?.gps_coordinates?.latitude;
  const lng = property?.gps_coordinates?.longitude;

  const address = buildAddress(property, province);

  return {
    _localId: `${property?.property_token || property?.name || "hotel"}-${Math.random()
      .toString(16)
      .slice(2)}`,
    name: property?.name || "ไม่ทราบชื่อโรงแรม",
    type: "โรงแรม",
    stars,
    price_per_night: price,
    price_text: formatPriceText(price, currency),
    rating: toNumber(reviewValue, 0),
    review_count: toNumber(reviewCount, 0),
    address,
    image,
    website_url: "",
    google_hotels_url: buildGoogleHotelsUrl(property, province, address),
    amenities: Array.isArray(property?.amenities) ? property.amenities : [],
    check_in_time: property?.check_in_time || "",
    check_out_time: property?.check_out_time || "",
    lat,
    lng,
    description: address,
    source: "serpapi-google-hotels",
  };
}

export async function searchHotelsViaSerpApi({
  q,
  province,
  checkIn,
  checkOut,
  adults = 2,
  currency = "THB",
}: SearchHotelsParams): Promise<HotelItem[]> {
  if (!config.SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY is missing");
  }

  const keyword = q?.trim() || `${province} hotel`;

  const res = await axios.get(SERPAPI_URL, {
    params: {
      engine: "google_hotels",
      api_key: config.SERPAPI_KEY,
      q: keyword,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults,
      currency,
      gl: "th",
      hl: "th",
      no_cache: false,
    },
    timeout: 30000,
  });

  const properties = Array.isArray(res.data?.properties)
    ? res.data.properties
    : [];

  return properties.map((property: any) =>
    mapProperty(property, province, currency)
  );
}
