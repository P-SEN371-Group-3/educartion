"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { handleLoadProducts } from "@/controllers/productController";
import type { Product } from "@/lib/product-contract";

const productImageBasePath = "/product_images";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function buildProductImagePath(imageValue?: string): string {
  if (typeof imageValue !== "string" || !imageValue.trim()) {
    return "/images/product-placeholder.png";
  }

  const trimmed = imageValue.trim().replace(/^\/+/, "");
  return `${productImageBasePath}/${trimmed}`;
}

function extractImageUrl(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return (
    (typeof record.image_url === "string" && record.image_url) ||
    (typeof record.imageUrl === "string" && record.imageUrl) ||
    (typeof record.url === "string" && record.url) ||
    undefined
  );
}

function resolveImageFromCollection(images: unknown): string | undefined {
  if (!Array.isArray(images) || images.length === 0) {
    return undefined;
  }

  const primary = images.find((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }
    const record = item as Record<string, unknown>;
    return record.is_primary === true || record.isPrimary === true;
  });

  return extractImageUrl(primary ?? images[0]);
}

function resolveImageUrl(product: Product): string {
  const image =
    (typeof product.image === "string" && product.image) ||
    (typeof product.image_url === "string" && product.image_url) ||
    (typeof product["image_url"] === "string" && String(product["image_url"])) ||
    (typeof product["image"] === "string" && String(product["image"])) ||
    (typeof product["imageUrl"] === "string" && String(product["imageUrl"]));

  if (image) {
    return buildProductImagePath(image);
  }

  const imageFromCollection =
    resolveImageFromCollection(product["product_image"]) ??
    resolveImageFromCollection(product["product_images"]) ??
    resolveImageFromCollection(product["images"]);

  if (imageFromCollection) {
    return buildProductImagePath(imageFromCollection);
  }

  return "/images/product-placeholder.png";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await handleLoadProducts();

        if (!isMounted) {
          return;
        }

        if (result.ok) {
          setProducts(result.data ?? []);
        } else {
          setProducts([]);
          setError(result.error ?? "Failed to load products.");
        }
      } catch (fetchError) {
        if (isMounted) {
          setProducts([]);
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load products.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const name = typeof product.name === "string" ? product.name.toLowerCase() : "";
      const description = typeof product.description === "string" ? product.description.toLowerCase() : "";
      const rawId = product.id ?? product["product_id"];
      const idText =
        typeof rawId === "string" || typeof rawId === "number" ? String(rawId).toLowerCase() : "";

      return name.includes(query) || description.includes(query) || idText.includes(query);
    });
  }, [products, search]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#060816_0%,#0b1020_100%)] px-6 py-10 text-slate-100 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[28px_28px] opacity-20" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1600px] flex-col gap-6">
        <header className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
            <div className="flex min-w-[170px] items-center justify-start">
              <div className="inline-flex h-11 w-40 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
                Logo
              </div>
            </div>

            <div className="flex flex-1 justify-center">
              <label className="relative w-full max-w-2xl">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/60 focus:bg-white/8 focus:ring-2 focus:ring-amber-300/20"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20L16.65 16.65" />
                  </svg>
                </span>
              </label>
            </div>

            <div className="flex min-w-[170px] items-center justify-end gap-2 md:gap-3">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
                <span>Account</span>
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                  <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L21 7H7" />
                </svg>
                <span>Cart</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:p-8">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-200">
                  Browse
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Products</h1>
                <p className="text-sm leading-6 text-slate-300">
                  Discover our collection of available products.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                {filteredProducts.length} Results
              </span>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="h-6 w-3/5 animate-pulse rounded bg-white/10" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
                    <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-white/5" />
                    <div className="mt-5 h-6 w-1/3 animate-pulse rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
                No products found.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product, index) => {
                  const rawId = product.id ?? product.product_id ?? product["product_id"] ?? index;
                  const productId = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : String(index);
                  const imageUrl = resolveImageUrl(product);

                  return (
                    <Link
                      key={productId}
                      href={`/products/${productId}`}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:bg-white/8 hover:border-amber-300/40 backdrop-blur-xl"
                    >
                      <article>
                        <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                          <div className="relative aspect-[4/3] w-full">
                            <img src={imageUrl} alt={product.name ?? "Product image"} className="h-full w-full object-cover" />
                          </div>
                        </div>
                        <h2 className="text-xl font-semibold text-white transition group-hover:text-amber-200">
                          {product.name ?? "Unnamed product"}
                        </h2>
                        {product.description ? (
                          <p className="mt-3 text-sm leading-6 text-slate-300">{product.description}</p>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-slate-500">No description available.</p>
                        )}
                        {typeof product.price === "number" ? (
                          <p className="mt-5 text-lg font-semibold text-amber-300">
                            {formatCurrency(product.price)}
                          </p>
                        ) : null}
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
