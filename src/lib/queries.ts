import { queryOptions } from "@tanstack/react-query";
import {
  listBusinesses,
  getOwnedBusiness,
  publicBusiness,
  listStats,
} from "./businesses.functions";
export const businessesQuery = queryOptions({
  queryKey: ["businesses"],
  queryFn: () => listBusinesses(),
});
export const statsQuery = queryOptions({ queryKey: ["stats"], queryFn: () => listStats() });
export const ownedBusinessQuery = (slug: string) =>
  queryOptions({
    queryKey: ["business", slug],
    queryFn: () => getOwnedBusiness({ data: { slug } }),
  });
export const publicBusinessQuery = (slug: string) =>
  queryOptions({
    queryKey: ["publicBusiness", slug],
    queryFn: () => publicBusiness({ data: { slug } }),
  });
