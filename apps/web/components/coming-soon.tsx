import { Hourglass } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ComingSoonItem {
  /** Faz K stage, e.g. "K1". */
  stage: string;
  text: string;
}

/** Honest placeholder: what this screen will hold and in which stage. */
export async function ComingSoon({ items }: { items: readonly ComingSoonItem[] }) {
  const t = await getTranslations("comingSoon");
  return (
    <Card>
      <CardHeader>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-warning px-3 py-1 text-sm font-bold text-warning-foreground">
          <Hourglass className="size-4" aria-hidden="true" />
          {t("badge")}
        </span>
        <CardTitle className="sr-only">{t("badge")}</CardTitle>
        <p className="text-muted-foreground">{t("intro")}</p>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={`${item.stage}-${item.text}`} className="flex gap-3">
              <span
                className="mt-0.5 inline-flex h-7 min-w-11 items-center justify-center rounded-lg bg-muted px-2 text-sm font-bold text-foreground tabular-nums"
                aria-label={`${t("stageLabel")} ${item.stage}`}
              >
                {item.stage}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
