"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { ApiError } from "@/services/api-client";
import {
  catalogKeys,
  getBundle,
  getCollection,
  getProduct,
  getProductFilters,
  listBundles,
  listCategories,
  listCollections,
  listOccasions,
  listProducts,
} from "./api";
import type { ProductQuery } from "./types";

/**
 * Catalogue reads as TanStack queries. The catalogue is public, but the prices in it depend on who
 * is looking (a verified planner's trade rate), so every query is keyed by the viewer and waits
 * until the session answer is in: otherwise a signed-in planner would flash standard prices first.
 */
const FIVE_MINUTES = 5 * 60_000;
const ONE_MINUTE = 60_000;
export const PAGE_SIZE = 24;

/** A product that is not there will not appear on retry; anything else gets a couple more tries. */
const retryUnlessMissing = (failures: number, error: Error) => !(error instanceof ApiError && error.status === 404) && failures < 2;

function useViewer(): { key: string; ready: boolean } {
  const { status, account } = useSession();
  return { key: account?.id ?? "anon", ready: status !== "loading" };
}

/** Category tree, with product counts. Prices play no part, so it is not keyed by viewer. */
export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: ({ signal }) => listCategories(signal),
    staleTime: FIVE_MINUTES,
  });
}

export function useOccasions() {
  return useQuery({
    queryKey: catalogKeys.occasions,
    queryFn: ({ signal }) => listOccasions(signal),
    staleTime: FIVE_MINUTES,
  });
}

/** Filter choices for the products a query's category, sub-category, occasion and search term leave in play. */
export function useProductFilters(query: ProductQuery) {
  const scope: ProductQuery = {
    categories: query.categories,
    subcategories: query.subcategories,
    occasion: query.occasion,
    q: query.q,
  };
  return useQuery({
    queryKey: catalogKeys.filters(scope),
    queryFn: ({ signal }) => getProductFilters(scope, signal),
    staleTime: ONE_MINUTE,
    placeholderData: keepPreviousData,
  });
}

/** Pages of products, loaded on demand; `fetchNextPage` adds the next 24. */
export function useProductList(query: ProductQuery) {
  const viewer = useViewer();
  return useInfiniteQuery({
    queryKey: [...catalogKeys.products(query), viewer.key],
    queryFn: ({ pageParam, signal }) => listProducts({ ...query, page: pageParam, size: PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => ((last.page + 1) * last.size < last.total ? last.page + 1 : undefined),
    enabled: viewer.ready,
    staleTime: ONE_MINUTE,
    placeholderData: keepPreviousData,
  });
}

/** The first few products for a query (home page rail); one request, no paging. */
export function useProductPreview(query: ProductQuery, size: number) {
  const viewer = useViewer();
  return useQuery({
    queryKey: [...catalogKeys.products(query), "preview", size, viewer.key],
    queryFn: ({ signal }) => listProducts({ ...query, page: 0, size }, signal),
    enabled: viewer.ready,
    staleTime: ONE_MINUTE,
  });
}

export function useProduct(slug: string | undefined) {
  const viewer = useViewer();
  return useQuery({
    queryKey: [...catalogKeys.product(slug ?? ""), viewer.key],
    queryFn: ({ signal }) => getProduct(slug!, signal),
    enabled: viewer.ready && !!slug,
    staleTime: ONE_MINUTE,
    retry: retryUnlessMissing,
  });
}

export function useBundles(occasion?: string) {
  const viewer = useViewer();
  return useQuery({
    queryKey: [...catalogKeys.bundles(occasion), viewer.key],
    queryFn: ({ signal }) => listBundles(occasion, signal),
    enabled: viewer.ready,
    staleTime: ONE_MINUTE,
  });
}

export function useBundle(slug: string | undefined) {
  const viewer = useViewer();
  return useQuery({
    queryKey: [...catalogKeys.bundle(slug ?? ""), viewer.key],
    queryFn: ({ signal }) => getBundle(slug!, signal),
    enabled: viewer.ready && !!slug,
    staleTime: ONE_MINUTE,
    retry: retryUnlessMissing,
  });
}

export function useCollections(occasion?: string) {
  return useQuery({
    queryKey: catalogKeys.collections(occasion),
    queryFn: ({ signal }) => listCollections(occasion, signal),
    staleTime: ONE_MINUTE,
  });
}

export function useCollection(slug: string | undefined) {
  const viewer = useViewer();
  return useQuery({
    queryKey: [...catalogKeys.collection(slug ?? ""), viewer.key],
    queryFn: ({ signal }) => getCollection(slug!, signal),
    enabled: viewer.ready && !!slug,
    staleTime: ONE_MINUTE,
    retry: retryUnlessMissing,
  });
}
