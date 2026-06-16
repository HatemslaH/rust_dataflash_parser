export type FieldSeriesType = "numeric" | "text" | "int16x32";

export interface FmtStat {
  count: number;
  msg_size: number;
  size: number;
}

export interface FieldInfo {
  name: string;
  units?: string;
  multiplier?: number;
}

export interface MessageTypeEntry {
  name: string;
  count: number;
  loaded: boolean;
  fields: FieldInfo[];
}

export interface LogSummary {
  file_name: string;
  file_size: number;
  message_type_count: number;
  available_types: string[];
  fmt_stats: Record<string, FmtStat>;
  start_time?: string;
}

export interface LogMetadata {
  start_time?: string;
  file_size: number;
  message_type_count: number;
}

export interface FieldSeries {
  type: FieldSeriesType;
  values: number[] | string[] | number[][];
}

export interface FieldRequest {
  messageType: string;
  field: string;
  instance?: number;
}

export interface ParseProgress {
  phase: "indexing" | "loading" | "ready" | "error";
  percent: number;
  message: string;
}

export type Unsubscribe = () => void;

export interface ParserBackend {
  readonly platform: "web" | "desktop";

  openFile(source: File | string): Promise<LogSummary>;
  closeLog(): Promise<void>;
  listMessageTypes(): Promise<MessageTypeEntry[]>;
  loadMessageTypes(names: string[]): Promise<void>;
  getFieldSeries(request: FieldRequest): Promise<FieldSeries>;
  getMetadata(): Promise<LogMetadata>;
  onProgress(callback: (progress: ParseProgress) => void): Unsubscribe;
}
