"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ProgressPill } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { localizeContent } from "@/i18n/localizeContent";
import { getVocabById } from "@/lib/vocabData";
import { getKnownWords, getWeakWords } from "@/lib/storage";
import type { CategoryId, VocabItem } from "@/types/learning";

/** Category display names for the review cards. cafe/reise/… ids map to the same
 *  localized category names used everywhere; "review" isn't shown here. */
const CATEGORY_LABEL_KEY: Record<CategoryId, string> = {
  cafe: "Café",
  reise: "Reise",
  schule: "Schule",
  freunde: "Freunde",
  review: "Review",
};

interface ReviewData {
  weakWords: string[];
  knownWords: string[];
}

function loadReviewData(): ReviewData {
  return {
    weakWords: getWeakWords(),
    knownWords: getKnownWords(),
  };
}

function resolveVocab(ids: string[]): VocabItem[] {
  return ids
    .map((id) => getVocabById(id))
    .filter((vocab): vocab is VocabItem => Boolean(vocab));
}

interface PageState {
  mounted: boolean;
  data: ReviewData | null;
}

const INITIAL_STATE: PageState = { mounted: false, data: null };

export default function ReviewPage() {
  const router = useRouter();
  const { locale, messages } = useLanguage();
  const [state, setState] = useState<PageState>(INITIAL_STATE);

  useEffect(() => {
    // One-time client-only read of localStorage after hydration; there is no server
    // snapshot to synchronize against, so useSyncExternalStore does not apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ mounted: true, data: loadReviewData() });
  }, []);

  if (!state.mounted || !state.data) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {messages.common.loading}
        </p>
      </main>
    );
  }

  const weakVocab = resolveVocab(state.data.weakWords);
  const knownVocab = resolveVocab(state.data.knownWords);

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            {messages.vocabulary.toMap}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/vocabulary")}>
            {messages.review.toCollection}
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            {messages.review.title}
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">{messages.review.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ProgressPill label={messages.review.toPractice} value={weakVocab.length} variant="xp" />
          <ProgressPill label={messages.review.secure} value={knownVocab.length} variant="level" />
        </div>

        {weakVocab.length === 0 ? (
          <Card variant="default" className="text-center">
            <p className="font-bold text-[var(--color-ink)]">{messages.review.noWeakTitle}</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{messages.review.noWeakBody}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="primary" onClick={() => router.push("/vocabulary")}>
                {messages.review.toCollection}
              </Button>
              <Button variant="secondary" onClick={() => router.push("/")}>
                {messages.vocabulary.toMap}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {weakVocab.map((vocab) => (
              <Card key={vocab.id} variant="default" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="yellow">{messages.review.practiceBadge}</Badge>
                  <Badge variant="gray">
                    {localizeContent(CATEGORY_LABEL_KEY[vocab.categoryId], locale)}
                  </Badge>
                </div>

                <div>
                  <p className="text-2xl font-extrabold text-[var(--color-ink)]">{vocab.kanji}</p>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {vocab.kana} · {vocab.romaji} · {localizeContent(vocab.german, locale)}
                  </p>
                </div>

                <p className="text-sm text-[var(--color-ink)]">
                  {localizeContent(vocab.shortTip, locale)}
                </p>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/practice?word=${vocab.id}`)}
                  className="mt-auto w-full"
                >
                  {messages.review.practiceCard}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {knownVocab.length > 0 ? (
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              {messages.review.alreadySecure}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {knownVocab.map((vocab) => (
                <Badge key={vocab.id} variant="green">
                  {vocab.kanji} · {localizeContent(vocab.german, locale)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
