"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ProgressPill } from "@/components/ui";
import { getVocabById } from "@/lib/vocabData";
import { getKnownWords, getWeakWords } from "@/lib/storage";
import type { CategoryId, VocabItem } from "@/types/learning";

const CATEGORY_LABELS: Record<CategoryId, string> = {
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
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
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
            Zur Karte
          </Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/vocabulary")}>
            Zur Wortkarten-Sammlung
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            Wiederholung
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Übe Karten, die dir noch schwerfallen.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ProgressPill label="Zu üben" value={weakVocab.length} variant="xp" />
          <ProgressPill label="Sicher" value={knownVocab.length} variant="level" />
        </div>

        {weakVocab.length === 0 ? (
          <Card variant="default" className="text-center">
            <p className="font-bold text-[var(--color-ink)]">Noch keine schwachen Wörter.</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Mache ein Quiz oder übe einzelne Karten, damit deine Wiederholungsliste wächst.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="primary" onClick={() => router.push("/vocabulary")}>
                Zur Wortkarten-Sammlung
              </Button>
              <Button variant="secondary" onClick={() => router.push("/")}>
                Zur Karte
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {weakVocab.map((vocab) => (
              <Card key={vocab.id} variant="default" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="yellow">Üben</Badge>
                  <Badge variant="gray">{CATEGORY_LABELS[vocab.categoryId]}</Badge>
                </div>

                <div>
                  <p className="text-2xl font-extrabold text-[var(--color-ink)]">{vocab.kanji}</p>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {vocab.kana} · {vocab.romaji} · {vocab.german}
                  </p>
                </div>

                <p className="text-sm text-[var(--color-ink)]">{vocab.shortTip}</p>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/practice?word=${vocab.id}`)}
                  className="mt-auto w-full"
                >
                  Karte üben
                </Button>
              </Card>
            ))}
          </div>
        )}

        {knownVocab.length > 0 ? (
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Schon sicher
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {knownVocab.map((vocab) => (
                <Badge key={vocab.id} variant="green">
                  {vocab.kanji} · {vocab.german}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
