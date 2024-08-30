import { randomInt } from "crypto";
import { Database } from "./types";
import { BaseDb } from "./db-base";
import { OpenFeature } from "@openfeature/server-sdk";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

/**
 * Pretends to be a postgres database.
 * Latency is not as good as local files, but concurrent access is unrestrained.
 */
export class PostgresDb extends BaseDb implements Database {
  private _featureFlagClient = OpenFeature.getClient();
  private _tracer = trace.getTracer("postgres-db");

  // reads have latency between 20 and 50 ms
  async get(table: string, id: string): Promise<string | null> {
    const span = await this.startSpan(
      `GET acme-db.${table}`,
      table,
      `SELECT * FROM ${table} WHERE User = '${id}'`
    );
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          return resolve(this._get(table, id));
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          reject(e);
        } finally {
          span.end();
        }
      }, randomInt(20, 50));
    });
  }

  async list(table: string): Promise<string[]> {
    const span = await this.startSpan(
      `LIST acme-db.${table}`,
      table,
      `SELECT * FROM ${table}`
    );
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          return resolve(this._list(table));
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          span.recordException(err);
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          reject(e);
        } finally {
          span.end();
        }
      }, randomInt(20, 50));
    });
  }

  private async startSpan(spanName: string, table: string, statement?: string) {
    const traceId = trace.getActiveSpan()?.spanContext().traceId;
    // Use the trace ID to select the node
    const node = Math.abs((traceId || "a").charCodeAt(0)) % 4;

    const useSecureProtocol = await this._featureFlagClient.getBooleanValue(
      "use-secure-protocol",
      false
    );
    const span = this._tracer.startSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: {
        "db.connection_string": `Server=Postgres\v16.2;Secure=${useSecureProtocol}`,
        "db.name": "acme-db",
        "db.statement": statement ?? spanName,
        "db.operation": "SELECT",
        "db.table": table,
        "db.instance.id": `node-${node}.remote.db`,
        "db.system": "postgresql",
        "db.node": node,
      },
    });
    if (useSecureProtocol && node == 3) {
      const e = new Error(`Connection refused on database node ${node}`);
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      span.end();
      throw e;
    }
    return span;
  }
}
