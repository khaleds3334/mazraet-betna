import { redirect } from "next/navigation";
import { OrderForm } from "@/components/customer/order/OrderForm";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getOrderForm } from "@/lib/queries/ordering";

/**
 * «اطلب الان» — the customer's order screen (C-20 → C-25, FR-26/FR-27).
 *
 * Everything the form needs is read here, on the server, in one round trip. The
 * form itself is a client component because every control on it changes what the
 * next one offers: the count fills the tray, the day decides which pickup slots
 * are still open, and the confirm bar reads the whole thing back.
 *
 * The tagline over the form lives inside `OrderForm`, not here: the success
 * screen replaces the whole screen including it (C-25), and a heading owned by
 * the page would have stayed behind.
 *
 * A closed sale is not a redirect. The customer arrives to prices, weights and
 * times he can look at, with the confirm button refusing and saying why — the
 * home screen is where a closed sale is announced (C-12), and bouncing him back
 * there from a tab he deliberately tapped explains nothing.
 */
export default async function OrderPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const data = await getOrderForm(customer.farmId);

  return <OrderForm data={data} />;
}
