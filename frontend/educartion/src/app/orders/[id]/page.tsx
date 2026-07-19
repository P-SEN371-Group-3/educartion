"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { OrderDetail, OrderItemDetail } from "@/lib/orders-contract";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildItemKey(item: OrderItemDetail, index: number): string {
  const productId = item.product_details?.product_id;
  return typeof productId === "number" ? String(productId) : `item-${index}`;
}

function calculateLineTotal(item: OrderItemDetail): number {
  const unitPrice = Number.isFinite(item.unit_price) ? item.unit_price : 0;
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const discount = Number.isFinite(item.discount_amount) ? item.discount_amount : 0;
  return unitPrice * quantity - discount;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawOrderId = params.id;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDetail() {
      if (!orderId) {
        if (isMounted) {
          setError("Order id is missing.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to load order.");
        }

        const data = (await response.json()) as OrderDetail;

        if (isMounted) {
          setOrder(data ?? null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load order.");
          setOrder(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrderDetail();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const items = useMemo(() => order?.order_item ?? [], [order]);
  const itemCount = useMemo(() => items.reduce((total, item) => total + (item.quantity ?? 0), 0), [items]);

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
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Order Details</p>
                <h1 className="mt-2 text-lg font-semibold text-white">
                  {order?.order_number ? `Order #${order.order_number}` : `Order #${orderId ?? "-"}`}
                </h1>
              </div>
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to orders
            </Link>
            {order ? (
              <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">
                {order.status}
              </span>
            ) : null}
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
                <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/8" />
                <div className="mt-5 h-4 w-full animate-pulse rounded bg-white/5" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
                <div className="h-5 w-1/4 animate-pulse rounded bg-white/10" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-20 rounded-2xl bg-white/5" />
                  ))}
                </div>
              </div>
            </div>
          ) : order ? (
            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
                <div className="mb-6 space-y-2">
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-200">Order Summary</p>
                  <h2 className="text-2xl font-semibold text-white">Order #{order.order_number}</h2>
                  <p className="text-sm text-slate-300">Placed on {formatDate(order.placed_at)}</p>
                </div>

                <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
                  <p>
                    <span className="font-semibold text-white">Subtotal:</span> {formatCurrency(order.subtotal_amount)}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Discount:</span> {formatCurrency(order.discount_amount)}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Total:</span> {formatCurrency(order.total_amount)}
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-200">Items</p>
                    <h3 className="text-xl font-semibold text-white">Order Items</h3>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                    {items.length} items · {itemCount} units
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                    No items were found for this order.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const product = item.product_details;
                      const lineTotal = calculateLineTotal(item);

                      return (
                        <article
                          key={buildItemKey(item, index)}
                          className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                            <div>
                              <h4 className="text-lg font-semibold text-white">
                                {product?.name ?? "Unnamed product"}
                              </h4>
                              {product?.description ? (
                                <p className="mt-1 text-sm text-slate-300">{product.description}</p>
                              ) : (
                                <p className="mt-1 text-sm text-slate-500">No description available.</p>
                              )}
                              {product?.supplier_details?.name ? (
                                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Supplier · {product.supplier_details.name}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-slate-200 sm:ml-auto">
                            <p>
                              <span className="font-semibold text-white">Qty:</span> {item.quantity}
                            </p>
                            <p>
                              <span className="font-semibold text-white">Unit:</span>{" "}
                              {formatCurrency(item.unit_price)}
                            </p>
                            <p>
                              <span className="font-semibold text-white">Discount:</span>{" "}
                              {formatCurrency(item.discount_amount)}
                            </p>
                            <p>
                              <span className="font-semibold text-white">Line total:</span>{" "}
                              {formatCurrency(lineTotal)}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : error ? null : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
              Order not found.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
