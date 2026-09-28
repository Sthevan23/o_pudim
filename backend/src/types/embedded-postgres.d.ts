declare module "embedded-postgres" {
  export default class EmbeddedPostgres {
    constructor(options?: Record<string, unknown>);
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    createDatabase(name: string): Promise<void>;
  }
}
