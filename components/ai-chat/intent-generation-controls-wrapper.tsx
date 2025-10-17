"use client";

import { IntentGenerationControls } from "./intent-generation-controls";
import type { CopilotControlsProps } from "@/types/copilot-tool";

interface IntentControlsState {
  language: string;
  avgCount: number;
  forceOptions: boolean;
  includeInHistory: boolean;
  contextVariables: string[];
}

const DEFAULT_STATE: IntentControlsState = {
  language: "en",
  avgCount: 4,
  forceOptions: false,
  includeInHistory: false,
  contextVariables: [],
};

export function IntentGenerationControlsWrapper({
  value,
  onChange,
}: CopilotControlsProps<IntentControlsState>) {
  const state: IntentControlsState = {
    ...DEFAULT_STATE,
    ...(value as IntentControlsState),
  };

  return (
    <IntentGenerationControls
      language={state.language}
      onLanguageChange={language => onChange({ ...state, language })}
      avgCount={state.avgCount}
      onAvgCountChange={avgCount => onChange({ ...state, avgCount })}
      forceOptions={state.forceOptions}
      onForceOptionsChange={forceOptions =>
        onChange({ ...state, forceOptions })
      }
      includeInHistory={state.includeInHistory}
      onIncludeInHistoryChange={includeInHistory =>
        onChange({ ...state, includeInHistory })
      }
      contextVariables={state.contextVariables}
      onContextVariablesChange={contextVariables =>
        onChange({ ...state, contextVariables })
      }
    />
  );
}

