import express, { Express, NextFunction, Request, Response } from "express";
import { Client, OpenFeature, ProviderEvents } from "@openfeature/server-sdk";
import { FlagdProvider } from "@openfeature/flagd-provider";
import { faker } from "@faker-js/faker";

import { Database, getConnection } from "./db";
import { EventLoggerProvider } from "@opentelemetry/sdk-events";
import { events } from "@opentelemetry/api-events";
import { logs } from "@opentelemetry/api-logs";
import { EventHook } from "./event-hook";

const PORT: number = parseInt(process.env.PORT || "3000");
const app: Express = express();

console.log("starting the application");

declare global {
  namespace Express {
    interface Request {
      featureFlagClient: Client;
      db: Database;
    }
  }
}

async function featureFlagClientMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantId = req.header("X-Tenant");
  const featureFlagClient = OpenFeature.getClient();

  featureFlagClient.setContext({
    tenantId: tenantId ?? "unknown",
    targetingKey: faker.string.uuid(),
  });
  req.featureFlagClient = featureFlagClient;
  next();
}

async function databaseMiddleware(
  req: Request,
  _: Response,
  next: NextFunction
) {
  req.db = await getConnection(req.featureFlagClient);
  next();
}

app.get("/health", (_, res) => {
  console.log("health check");
  res.send("OK");
});

app.use(featureFlagClientMiddleware);
app.use(databaseMiddleware);

events.setGlobalEventLoggerProvider(
  new EventLoggerProvider(logs.getLoggerProvider() as any)
);
const eventLogger = events.getEventLogger("feature-flag");

app.get("/favorites", async (req, res, next) => {
  try {
    const users = await req.db.list("colors");
    eventLogger.emit({
      name: "favorites",
      data: {
        count: users.length,
      },
      attributes: {
        "event.provider": "FEATURE_FLAG",
        "event.type": "GET_FAVORITES",
      },
    });

    const out = await Promise.all(
      users.map(async (user) => {
        const color = await req.db.get("colors", user);
        return {
          user,
          favorites: {
            color,
          },
        };
      })
    );
    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.get("/favorites/:user", async (req, res, next) => {
  try {
    const color = await req.db.get("colors", req.params.user);
    res.json({ color });
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong");
});

app.listen(PORT, async () => {
  OpenFeature.addHooks(new EventHook("ff-event-prototype"));
  try {
    OpenFeature.addHandler(ProviderEvents.Ready, (eventDetails) => {
      console.log("ready", eventDetails);
    });
    OpenFeature.addHandler(ProviderEvents.Error, (eventDetails) => {
      console.log("error", eventDetails);
    });
    OpenFeature.addHandler(ProviderEvents.ConfigurationChanged, (eventDetails) => {
      console.log("configuration changed", eventDetails);
    });
    OpenFeature.addHandler(ProviderEvents.Stale, (eventDetails) => {
      console.log("stale", eventDetails);
    });
    console.log("registering flagd provider");
    await Promise.race([
      OpenFeature.setProviderAndWait(new FlagdProvider()),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  } catch (err) {
    console.log("Unable to connect to flagd");
    console.error(err);
  }
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
