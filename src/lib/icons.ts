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
  InstallingUpdates02Icon, // figma: installing-updates-02 — sidebar settings gear
  Notification01Icon, // figma: the bell (body + clapper arc) used in the customer header
  Menu03Icon, // figma: icon/menu-03 — staggered-length lines
  MoreVerticalIcon,
  Door01Icon, // figma: door-01 — sidebar sign-out
  // ── Actions ──
  Add01Icon,
  Delete02Icon,
  PencilEdit02Icon, // figma: pencil-edit-02 — «تعديل» on the invoice
  Cancel01Icon,
  Cancel02Icon, // figma: cancel-02
  Search02Icon, // figma: search-02
  Tick02Icon, // the tick inside a ticked checkbox
  FilterIcon, // figma: filter — the funnel that scopes the orders list to a cycle
  LayerAddIcon, // figma: layer-add — the glyph inside the "اضافة طلب" button
  Download04Icon, // figma: download-04 — «تحميل» on the install banner
  PlusSignIcon,
  MinusSignIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon, // figma: line-md:arrow-up, rotated — the long "open this" arrow
  ArrowDown01Icon,
  Link01Icon, // figma: link-01 — FAQ link in the sidebar
  // ── Feedback (toasts / status) ──
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Alert01Icon,
  InformationCircleIcon,
  InformationSquareIcon, // figma: information-square — "حول التطبيق"
  Loading03Icon,
  TickDouble03Icon, // figma: tick-double-03
  // ── Domain: orders, money, cycle ──
  WeightScale01Icon, // figma: weight-scale-01 — the weighing screen
  PackageDelivered01Icon, // figma: package-delivered-01
  Wallet01Icon, // figma: wallet-01 — sidebar debt card
  WalletAdd01Icon, // figma: wallet-add-01
  MoneyBag02Icon, // figma: money-bag-02
  MoneySendFlow01Icon, // figma: money-send-flow-01
  Invoice03Icon,
  BorderFullIcon, // figma: border-full — "طلباتي السابقة" in the sidebar
  Calendar01Icon, // figma: calendar-01
  DateTimeIcon, // figma: date-time — calendar with a clock (cycle start day)
  Clock01Icon,
  Call02Icon,
  TelephoneIcon, // figma: telephone — "تواصل معنا" in the sidebar
  BubbleChatQuestionIcon, // figma: bubble-chat-question — the "تواصل معنا" pill
  UserIcon,
  UserCircleIcon, // figma: user-sharing layer, but the glyph is a plain user-in-circle
  TemperatureIcon,
  ChartBarLineIcon,
  PieChartIcon,
  // ── Domain: cycle dashboard (A-11) ──
  SkullIcon, // figma: skull — عدد النافق (mortality)
  EggsIcon, // figma: eggs — cycle title glyph
  NoteEditIcon, // figma: note-edit — تسجيل مصاريف
  Calendar02Icon, // figma: calendar-02 — cycle start-date meta
  // ── Domain: selling dashboard (A-20) ──
  StoreVerified02Icon, // figma: store-verified-02 — الفراخ المتوفرة
  Timer01Icon, // figma: timer-01 — الفراخ المطلوبة
  Wallet03Icon, // figma: wallet-03 — الديون
  Wallet02Icon, // figma: wallet-02 — في المحفظة
  KnivesIcon, // figma: knives — الطلبات قيد التشغيل
  // ── Domain: the customer's order track (C-41→C-43) ──
  DocumentValidationIcon, // figma: document-validation — «التأكيد و الذبح»
} from "@hugeicons/core-free-icons";
// The chick glyph ("عدد الكتاكيت") isn't in the Hugeicons free pack — it's a
// bespoke design SVG in components/admin/shared/ChickIcon (T-19 rationale).

export const icons = {
  // Navigation & shell
  home: Home01Icon,
  order: ShoppingCart01Icon,
  customers: UserGroup03Icon,
  settings: InstallingUpdates02Icon,
  notification: Notification01Icon,
  menu: Menu03Icon,
  more: MoreVerticalIcon,
  logout: Door01Icon,

  // Actions
  add: Add01Icon,
  delete: Delete02Icon,
  edit: PencilEdit02Icon,
  close: Cancel01Icon,
  cancel: Cancel02Icon,
  search: Search02Icon,
  check: Tick02Icon,
  filter: FilterIcon,
  // Every "add" button in the admin app uses Figma's layer-add glyph (A-50
  // «اضافة طلب», A-30 «اضافة عميل», A-42 «انشاء دورة جديدة»); a name per screen
  // keeps each one reading semantically.
  addOrder: LayerAddIcon,
  addCustomer: LayerAddIcon,
  addCycle: LayerAddIcon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
  arrowRight: ArrowRight01Icon,
  arrowLeft: ArrowLeft01Icon,
  // The long straight arrow at the end of a cycle row (A-42): a shaft, not the
  // chevron `arrowLeft` draws. It points inline-end because in RTL that is
  // "onwards" — into the cycle.
  openDetails: ArrowLeft02Icon,
  arrowDown: ArrowDown01Icon,
  download: Download04Icon,
  link: Link01Icon,

  // Feedback — toast types map here (success/error/warning/info) + loading
  success: CheckmarkCircle02Icon,
  error: AlertCircleIcon,
  warning: Alert01Icon,
  info: InformationCircleIcon,
  infoSquare: InformationSquareIcon,
  loading: Loading03Icon,
  checkDouble: TickDouble03Icon,

  // Domain
  weight: WeightScale01Icon,
  delivered: PackageDelivered01Icon,
  wallet: Wallet01Icon,
  walletAdd: WalletAdd01Icon,
  income: MoneyBag02Icon,
  payment: MoneySendFlow01Icon,
  invoice: Invoice03Icon,
  pastOrders: BorderFullIcon,
  calendar: Calendar01Icon,
  dateTime: DateTimeIcon,
  clock: Clock01Icon,
  phone: Call02Icon,
  telephone: TelephoneIcon,
  contact: BubbleChatQuestionIcon,
  user: UserIcon,
  userCircle: UserCircleIcon,
  temperature: TemperatureIcon,
  chart: ChartBarLineIcon,
  pieChart: PieChartIcon,

  // Cycle dashboard (A-11)
  mortality: SkullIcon,
  cycle: EggsIcon,
  expenseEdit: NoteEditIcon,
  calendarStart: Calendar02Icon,

  // Selling dashboard (A-20). `ordersNew` deliberately shares the border-full
  // glyph with `pastOrders` — the design uses it for both, and separate names
  // keep each screen reading semantically.
  chickensAvailable: StoreVerified02Icon,
  chickensSold: TickDouble03Icon,
  chickensRequested: Timer01Icon,
  debt: Wallet03Icon,
  cash: Wallet02Icon,
  ordersNew: BorderFullIcon,
  ordersProcessing: KnivesIcon,

  // Orders list (A-50) empty states. `ordersWaiting` is the same timer glyph as
  // `chickensRequested` — the design uses it for both "waiting on the admin"
  // ideas, and the two names keep each screen reading semantically.
  ordersWaiting: Timer01Icon,

  // The customer's order track (C-41→C-43). The checkpoint between «تم الوزن»
  // and «الذبح» is the customer reading the invoice and saying go ahead — the
  // design marks it with a stamped document.
  priceConfirm: DocumentValidationIcon,
} as const;

export type IconName = keyof typeof icons;
