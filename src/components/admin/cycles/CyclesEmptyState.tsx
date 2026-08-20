import { EmptyCyclesIllustration } from "./EmptyCyclesIllustration";
import { CreateCycleLauncher } from "./CreateCycleLauncher";

/**
 * The cycles screen before the farm has ever registered a cycle (A-40): the
 * archive illustration, a short explainer, and the CTA that opens the
 * create-cycle sheet (A-41) in place. Seen once in the life of a farm.
 */
export function CyclesEmptyState() {
  return (
    <main className="flex flex-1 flex-col px-screen pt-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <EmptyCyclesIllustration size={188} />
        <div className="flex flex-col gap-2.5">
          <h1 className="text-h4 font-bold text-foreground">
            لا توجد اي دورات مسجلة بعد
          </h1>
          <p className="max-w-[325px] text-base text-muted">
            يمكنك البدء بتسجيل اول دورة للمزرعة لمتابعتها و إدارتها بسهولة
          </p>
        </div>
      </div>

      <div className="mb-4">
        <CreateCycleLauncher label="ابدأ سجل اول دورة" />
      </div>
    </main>
  );
}
