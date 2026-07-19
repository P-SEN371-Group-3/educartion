"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { handleLoadProducts } from "@/controllers/productController";
import type { CartItem } from "@/lib/cart-contract";
import type { Product } from "@/lib/product-contract";
import * as cartService from "@/services/cartService";

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

function resolveProductId(product: Product, fallbackId: string): string {
  const rawId = product.id ?? product.product_id ?? product["product_id"] ?? fallbackId;
  return typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : fallbackId;
}

function resolveSupplierLabel(product: Product): string {
  const supplierName =
    (typeof product.supplier_name === "string" && product.supplier_name.trim()) ||
    (typeof product["supplier_name"] === "string" && String(product["supplier_name"]).trim()) ||
    (typeof product["supplier"] === "string" && String(product["supplier"]).trim());

  if (supplierName) {
    return supplierName;
  }

  const supplierId = product.supplier_id ?? product["supplier_id"];
  if (typeof supplierId === "string" || typeof supplierId === "number") {
    return `Supplier #${supplierId}`;
  }

  return "Unknown supplier";
}

function resolveStockQuantity(product: Product): number | null {
  const candidates = [
    product.stock_quantity,
    product["stock_quantity"],
    product["stock"],
    product["quantity"],
    product["available"],
  ];

  for (const value of candidates) {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
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

export default function ProductDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await handleLoadProducts();

        if (!isMounted) {
          return;
        }

        if (!result.ok) {
          setError(result.error ?? "Failed to load product.");
          setProduct(null);
          return;
        }

        const found = (result.data ?? []).find((item, index) => {
          const itemId = resolveProductId(item, String(index));
          return itemId === routeId;
        });

        if (!found) {
          setError("Product not found.");
          setProduct(null);
          return;
        }

        setProduct(found);
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load product.");
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [routeId]);

  const stockQuantity = useMemo(() => (product ? resolveStockQuantity(product) : null), [product]);
  const normalizedStock = typeof stockQuantity === "number" ? Math.max(0, stockQuantity) : 0;
  const isInStock = normalizedStock > 0;
  const supplierLabel = product ? resolveSupplierLabel(product) : "";
  const imageUrl = product ? resolveImageUrl(product) : "/images/product-placeholder.png";
  const maxQuantity = isInStock ? normalizedStock : 1;

  const updateQuantity = (value: number) => {
    setSuccessMessage(null);
    const safeValue = Number.isFinite(value) ? value : 1;
    const clamped = Math.min(Math.max(1, safeValue), Math.max(1, maxQuantity));
    setQuantity(clamped);
  };

  const handleAddToCart = () => {
    if (!product || !isInStock) {
      return;
    }

    const priceCents = typeof product.price === "number" ? product.price : 0;
    const productId = resolveProductId(product, routeId);
    const newItem: CartItem = {
      id: productId,
      title: product.name ?? "Untitled product",
      price: priceCents / 100,
      image: imageUrl,
      description: product.description,
      qty: quantity,
    };

    const current = cartService.loadCartFromStorage();
    const existingIndex = current.findIndex((item) => String(item.id) === String(productId));
    let updated: CartItem[] = [];

    if (existingIndex >= 0) {
      updated = current.map((item, index) =>
        index === existingIndex ? { ...item, qty: item.qty + quantity } : item,
      );
    } else {
      updated = [...current, newItem];
    }

    cartService.saveCartToStorage(updated);

    setSuccessMessage(`${quantity} item(s) added to cart.`);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#060816_0%,#0b1020_100%)] px-6 py-10 text-slate-100 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[28px_28px] opacity-20" />
      <div className="relative mx-auto w-full max-w-[1400px]">
        <div className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:p-8">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-200">Product</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {product?.name ?? "Product details"}
                </h1>
                <p className="text-sm leading-6 text-slate-300">
                  Review the details before adding this item to your cart.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <span>Back to products</span>
              </Link>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                <div className="h-[420px] rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-7 w-3/5 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-white/5" />
                  <div className="h-6 w-1/3 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ) : product ? (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
                    <div className="relative aspect-[4/5] w-full">
                      <img src={imageUrl} alt={product.name ?? "Product image"} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <span className="text-slate-400">Supplier</span>
                    <p className="mt-1 text-base font-semibold text-white">{supplierLabel}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Price</p>
                    <p className="mt-2 text-3xl font-semibold text-amber-300">
                      {typeof product.price === "number" ? formatCurrency(product.price) : "$0.00"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Availability</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={isInStock ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
                        {isInStock ? "In stock" : "Out of stock"}
                      </span>
                      <span className="text-sm text-slate-300">
                        {normalizedStock} available
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Description</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {product.description ?? "No description available for this product."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-sm font-semibold text-white mb-3">Quantity</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/50 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(quantity - 1)}
                          className="h-8 w-8 rounded-lg text-slate-200 transition hover:bg-white/10"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, maxQuantity)}
                          value={quantity}
                          onChange={(event) => updateQuantity(Number(event.target.value))}
                          className="h-8 w-16 rounded-lg border border-white/10 bg-slate-950/80 text-center text-sm text-white outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(quantity + 1)}
                          className="h-8 w-8 rounded-lg text-slate-200 transition hover:bg-white/10"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isInStock}
                        className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition ${isInStock
                          ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                          : "cursor-not-allowed bg-white/10 text-slate-500"
                          }`}
                      >
                        Add to cart
                      </button>
                    </div>
                    {successMessage && (
                      <div>
                        <br />
                        <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                          {successMessage}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
