/**
 * icons.ts — the ONE place every icon in the app is registered (BUILD-WORKFLOW §4).
 * Screens never import from Hugeicons directly; they use <Icon name="…" />.
 *
 * The design uses Hugeicons, so we use the same library for an exact match. Every
 * name below is verified to exist in @hugeicons/core-free-icons. Icon names that
 * come straight from the Figma layers (the design uses Hugeicons layer names) are
 * marked "figma". This map grows as screens are built — add the icon here first.
 */
import {
  // ── Navigation & shell ──
  Home01Icon,
  ShoppingCart01Icon,
  UserGroup03Icon, // figma: user-group-03
  Settings01Icon,
  Notification03Icon,
  Menu01Icon,
  MoreVerticalIcon,
  Logout01Icon,
  // ── Actions ──
  Add01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Cancel01Icon,
  Cancel02Icon, // figma: cancel-02
  Search02Icon, // figma: search-02
  PlusSignIcon,
  MinusSignIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowDown01Icon,
  // ── Feedback (toasts / status) ──
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Alert01Icon,
  InformationCircleIcon,
  Loading03Icon,
  TickDouble03Icon, // figma: tick-double-03
  // ── Domain: orders, money, cycle ──
  WeightScale01Icon, // figma: weight-scale-01 — the weighing screen
  PackageDelivered01Icon, // figma: package-delivered-01
  Wallet03Icon, // figma: wallet-03
  WalletAdd01Icon, // figma: wallet-add-01
  MoneyBag02Icon, // figma: money-bag-02
  MoneySendFlow01Icon, // figma: money-send-flow-01
  Invoice03Icon,
  Calendar01Icon, // figma: calendar-01
  Clock01Icon,
  Call02Icon,
  UserIcon,
  TemperatureIcon,
  ChartBarLineIcon,
  PieChartIcon,
} from "@hugeicons/core-free-icons";

export const icons = {
  // Navigation & shell
  home: Home01Icon,
  order: ShoppingCart01Icon,
  customers: UserGroup03Icon,
  settings: Settings01Icon,
  notification: Notification03Icon,
  menu: Menu01Icon,
  more: MoreVerticalIcon,
  logout: Logout01Icon,

  // Actions
  add: Add01Icon,
  delete: Delete02Icon,
  edit: PencilEdit01Icon,
  close: Cancel01Icon,
  cancel: Cancel02Icon,
  search: Search02Icon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
  arrowRight: ArrowRight01Icon,
  arrowLeft: ArrowLeft01Icon,
  arrowDown: ArrowDown01Icon,

  // Feedback — toast types map here (success/error/warning/info) + loading
  success: CheckmarkCircle02Icon,
  error: AlertCircleIcon,
  warning: Alert01Icon,
  info: InformationCircleIcon,
  loading: Loading03Icon,
  checkDouble: TickDouble03Icon,

  // Domain
  weight: WeightScale01Icon,
  delivered: PackageDelivered01Icon,
  wallet: Wallet03Icon,
  walletAdd: WalletAdd01Icon,
  debt: MoneyBag02Icon,
  payment: MoneySendFlow01Icon,
  invoice: Invoice03Icon,
  calendar: Calendar01Icon,
  clock: Clock01Icon,
  phone: Call02Icon,
  user: UserIcon,
  temperature: TemperatureIcon,
  chart: ChartBarLineIcon,
  pieChart: PieChartIcon,
} as const;

export type IconName = keyof typeof icons;
