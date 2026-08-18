import { AddCustomerLauncher } from "./AddCustomerLauncher";
import { DebtAmount } from "./DebtAmount";

/**
 * Top row of the customers screen (A-30): the «اضافة عميل» action on the right
 * and everything the farm is still owed on the left. DOM order is right-to-left,
 * the way the row reads — the same arrangement as `OrdersToolbar`.
 *
 * The button opens the registration sheet (A-34).
 */
export function CustomersToolbar({ totalDebt }: { totalDebt: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      <AddCustomerLauncher />

      <div className="flex min-w-0 flex-col items-end gap-1">
        <p className="text-xs text-muted">اجمالي الآجل</p>
        <DebtAmount amount={totalDebt} />
      </div>
    </div>
  );
}
