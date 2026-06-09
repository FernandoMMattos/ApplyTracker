'use client'

import { useState } from 'react'
import { SparklesIcon, CopyIcon, CheckIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { AiInsight } from '@prisma/client'

import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function FitScoreMeter({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-green-600 dark:text-green-400'
      : score >= 40
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'

  const bgColor = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3">
      <div className={cn('text-4xl font-bold tabular-nums', color)}>{score}</div>
      <div className="flex-1 space-y-1">
        <div className="text-muted-foreground text-xs">Fit score</div>
        <div className="bg-muted h-2 w-full rounded-full">
          <div
            className={cn('h-2 rounded-full transition-all', bgColor)}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function CoverLetterBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="bg-muted text-foreground max-h-60 overflow-y-auto rounded-lg p-4 font-sans text-xs leading-relaxed break-words whitespace-pre-wrap">
        {text}
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        onClick={handleCopy}
        aria-label="Copy cover letter"
      >
        {copied ? <CheckIcon className="text-green-500" /> : <CopyIcon />}
      </Button>
    </div>
  )
}

type Props = {
  applicationId: string
  insight: AiInsight | null
  onInsightGenerated: () => void
}

export function AiInsightsPanel({ applicationId, insight, onInsightGenerated }: Props) {
  const generateMutation = trpc.ai.generateInsights.useMutation({
    onSuccess: () => {
      toast.success('AI insights generated')
      onInsightGenerated()
    },
    onError: (err) => toast.error(err.message),
  })

  if (!insight) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">AI Insights</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-muted-foreground mb-3 text-sm">
            Generate AI-powered analysis: fit score, coaching suggestions, and a cover letter draft.
          </p>
          <Button
            size="sm"
            onClick={() => generateMutation.mutate({ applicationId })}
            disabled={generateMutation.isPending}
          >
            <SparklesIcon />
            {generateMutation.isPending ? 'Analysing…' : 'Generate Insights'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">AI Insights</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => generateMutation.mutate({ applicationId })}
          disabled={generateMutation.isPending}
          aria-label="Regenerate insights"
        >
          <RefreshCwIcon className={cn(generateMutation.isPending && 'animate-spin')} />
        </Button>
      </div>

      {insight.fitScore !== null && <FitScoreMeter score={insight.fitScore} />}

      <p className="text-muted-foreground text-sm">{insight.summary}</p>

      {insight.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggestions</p>
          <ul className="space-y-1.5">
            {insight.suggestions.map((s, i) => (
              <li key={i} className="text-muted-foreground flex gap-2 text-sm">
                <span className="text-foreground mt-0.5 font-medium">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight.coverLetterDraft && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Cover Letter Draft</p>
          <CoverLetterBlock text={insight.coverLetterDraft} />
        </div>
      )}
    </div>
  )
}
