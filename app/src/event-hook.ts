import { EvaluationDetails, FlagValue, Hook, HookContext, HookHints } from '@openfeature/server-sdk';
import { EventLogger, events } from "@opentelemetry/api-events";
import { ATTR_FEATURE_FLAG_KEY, ATTR_FEATURE_FLAG_PROVIDER_NAME, ATTR_FEATURE_FLAG_VARIANT, EVENT_NAME_FEATURE_FLAG_EVALUATION } from './proposed-attributes';

export class EventHook implements Hook {
    private _el: EventLogger;

    constructor(loggerName: string) {
        this._el = events.getEventLogger(loggerName);
    }

    after(hookContext: Readonly<HookContext<FlagValue>>, evaluationDetails: EvaluationDetails<FlagValue>, hookHints?: HookHints): void | Promise<void> {
        this._el.emit({
            name: EVENT_NAME_FEATURE_FLAG_EVALUATION,
            attributes: {
                [ATTR_FEATURE_FLAG_KEY]: evaluationDetails.flagKey,
                [ATTR_FEATURE_FLAG_PROVIDER_NAME]: hookContext.providerMetadata.name,
                [ATTR_FEATURE_FLAG_VARIANT]: evaluationDetails.variant
            },
        });
    }

    error(hookContext: Readonly<HookContext<FlagValue>>, error: unknown, hookHints?: HookHints): void | Promise<void> {
        hookContext.defaultValue
    }
}
