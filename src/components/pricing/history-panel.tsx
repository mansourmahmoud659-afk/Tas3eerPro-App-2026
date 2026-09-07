import { clearHistory, deleteEntry, formatDate, type HistoryEntry } from "@/lib/history";
import { IconHistory, IconTrash } from "./icons";
import { ActionButton } from "./ui";

export function HistoryPanel({
  entries,
  onChange,
  notify,
}: {
  entries: HistoryEntry[];
  onChange: (list: HistoryEntry[]) => void;
  notify: (msg: string) => void;
}) {
  return (
    <section className="glass rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconHistory className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-extrabold">سجل الحسابات</h2>
          <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
            {entries.length}
          </span>
        </div>
        {entries.length > 0 ? (
          <ActionButton
            variant="danger"
            icon={<IconTrash />}
            onClick={() => {
              onChange(clearHistory());
              notify("تم حذف كل السجل");
            }}
          >
            حذف السجل بالكامل
          </ActionButton>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا يوجد حسابات محفوظة بعد. استخدم أي حاسبة ثم اضغط «حفظ في السجل» — كل البيانات تُحفظ على
          جهازك فقط.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((e) => (
            <article key={e.id} className="rounded-2xl border border-border bg-secondary/25 p-4">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{e.tool}</h3>
                  {e.status ? (
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {e.status}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <time className="num text-[11px] text-muted-foreground" dir="ltr">
                    {formatDate(e.createdAt)}
                  </time>
                  <button
                    type="button"
                    aria-label="حذف هذا الحساب"
                    onClick={() => {
                      onChange(deleteEntry(e.id));
                      notify("تم حذف الحساب");
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </header>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ul className="space-y-1">
                  {e.inputs.map((i) => (
                    <li key={i.label} className="flex justify-between gap-3 text-[12px]">
                      <span className="text-muted-foreground">{i.label}</span>
                      <span className="num font-semibold" dir="ltr">
                        {i.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1">
                  {e.results.map((r) => (
                    <li key={r.label} className="flex justify-between gap-3 text-[12px]">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="num font-bold text-primary" dir="ltr">
                        {r.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
