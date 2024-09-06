import { EvaluationDetails, FlagValue, Hook, HookContext, HookHints, OpenFeatureError } from '@openfeature/server-sdk';
import { EventLogger, events } from "@opentelemetry/api-events";
import { ATTR_FEATURE_FLAG_ERROR_CODE, ATTR_FEATURE_FLAG_ERROR_MESSAGE, ATTR_FEATURE_FLAG_KEY, ATTR_FEATURE_FLAG_PROVIDER_NAME, ATTR_FEATURE_FLAG_VARIANT, EVENT_NAME_FEATURE_FLAG_EVALUATION } from './proposed-attributes';
import { Attributes } from '@opentelemetry/api';

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
        const attributes: Attributes = {
            [ATTR_FEATURE_FLAG_KEY]: hookContext.flagKey,
            [ATTR_FEATURE_FLAG_PROVIDER_NAME]: hookContext.providerMetadata.name,
            // default variant doesn't have a name
            // should we insert the actual default value?
            [ATTR_FEATURE_FLAG_VARIANT]: "default variant",
        };
        if (error instanceof OpenFeatureError) {
            attributes[ATTR_FEATURE_FLAG_ERROR_CODE] = error.code;
            attributes[ATTR_FEATURE_FLAG_ERROR_MESSAGE] = error.message;
        } else if (error instanceof Error) {
            // TODO general may not be the right choice
            attributes[ATTR_FEATURE_FLAG_ERROR_CODE] = "GENERAL";
            attributes[ATTR_FEATURE_FLAG_ERROR_MESSAGE] = error.message;
        } else {
            // this is just a guess tbh
            attributes[ATTR_FEATURE_FLAG_ERROR_CODE] = "GENERAL";
            attributes[ATTR_FEATURE_FLAG_ERROR_MESSAGE] = String(error);
        }

        this._el.emit({
            name: EVENT_NAME_FEATURE_FLAG_EVALUATION,
            attributes,
        });
    }
}
