/**
 * Reads for the signed-in customer. Uses the RLS-bound server client, so a
 * customer only ever sees their own row (policy customer_select).
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { computeInvoice } from "@/lib/calculations/invoice";

export interface CurrentCustomer {
  id: string;
  name: string;
  farmId: string;
}

/**
 * The customer behind the current session, or null if there isn't one (e.g. the
 * admin, or a signed-out visitor). Wrapped in React `cache` so the layout and the
 * page in the same request share a single database round-trip.
 */
export const getCurrentCustomer = cache(
  async (): Promise<CurrentCustomer | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("customer")
      .select("id, name, farm_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!data) return null;

    return { id: data.id, name: data.name, farmId: data.farm_id };
  },
);

/** A customer as the admin picks them — name + phone is all the picker shows. */
export interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

/**
 * Every customer of the farm, for the admin's customer picker (A-56). Loaded
 * once with the screen and filtered in the browser rather than queried per
 * keystroke: a family farm has tens of customers, not thousands, so one small
 * read beats a round trip per letter typed. Revisit if a farm ever grows past a
 * few hundred customers.
 */
export async function listFarmCustomers(
  farmId: string,
): Promise<CustomerOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer")
    .select("id, name, phone")
    .eq("farm_id", farmId)
    .order("name");
  return data ?? [];
}

/** A customer as the admin's list shows them (A-30): who they are, and where
 *  they stand — orders placed, money invoiced, money paid, money still owed. */
export interface CustomerSummary extends CustomerOption {
  debt: number;
  invoiceTotal: number;
  paidTotal: number;
  ordersTotal: number;
  ordersInCycle: number;
}

/** Running totals per customer while the orders are being walked. */
interface Tally {
  invoiceTotal: number;
  paidTotal: number;
  debt: number;
  ordersTotal: number;
  ordersInCycle: number;
}

const EMPTY_TALLY: Tally = {
  invoiceTotal: 0,
  paidTotal: 0,
  debt: 0,
  ordersTotal: 0,
  ordersInCycle: 0,
};

/** Round to piasters — money never carries float noise. */
const toPiasters = (n: number): number => Math.round(n * 100) / 100;

/**
 * Every customer of the farm with their standing (FR-8, FR-9) — what the admin's
 * customers screen reads (A-30). Every figure is computed on read (D-05) from the
 * customer's non-cancelled orders across all cycles, so the list can never
 * disagree with the order screens. `cycleId` scopes the "طلبات الدورة" count;
 * pass null on a farm with no cycle yet and it reads zero.
 *
 * Orphan orders (`customer_id` null, FR-13) belong to nobody yet, so they stay
 * out of every figure here. One read for the customers and one for the orders —
 * a family farm has tens of each, so summing in Node beats a view or a round trip
 * per customer.
 */
export async function listCustomerSummaries(
  farmId: string,
  cycleId: string | null,
): Promise<CustomerSummary[]> {
  const supabase = await createClient();

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase
      .from("customer")
      .select("id, name, phone")
      .eq("farm_id", farmId)
      .order("name"),
    supabase
      .from("orders")
      .select(
        "customer_id, cycle_id, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
      )
      .eq("farm_id", farmId)
      .not("customer_id", "is", null)
      .neq("status", "cancelled"),
  ]);

  const tallies = new Map<string, Tally>();
  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    const invoice = computeInvoice(
      order,
      order.order_line ?? [],
      order.payment ?? [],
    );
    const tally = tallies.get(order.customer_id) ?? { ...EMPTY_TALLY };

    tally.invoiceTotal += invoice.total;
    tally.paidTotal += invoice.paid;
    // Clamped per order: an overpaid order must not cancel out what another one
    // still owes, or a real debt would vanish from the list.
    tally.debt += Math.max(0, invoice.remaining);
    tally.ordersTotal += 1;
    if (cycleId && order.cycle_id === cycleId) tally.ordersInCycle += 1;

    tallies.set(order.customer_id, tally);
  }

  return (customers ?? []).map((customer) => {
    const tally = tallies.get(customer.id) ?? EMPTY_TALLY;
    return {
      ...customer,
      debt: toPiasters(tally.debt),
      invoiceTotal: toPiasters(tally.invoiceTotal),
      paidTotal: toPiasters(tally.paidTotal),
      ordersTotal: tally.ordersTotal,
      ordersInCycle: tally.ordersInCycle,
    };
  });
}
