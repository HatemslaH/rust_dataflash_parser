import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub window globally before importing anything that depends on it
const mockInvoke = vi.fn();
const mockListen = vi.fn(() => Promise.resolve(() => {}));

vi.stubGlobal("window", {
  __TAURI_INTERNALS__: {
    invoke: mockInvoke,
    transformCallback: vi.fn(() => 0),
    metadata: {},
    plugins: {},
  },
});

// Mock the modules as well to be safe
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
}));

import { createDesktopParserBackend } from "../../../../apps/desktop/src/platform";
import { createWebParserBackend } from "./web";

// Mock Web Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}
vi.stubGlobal("Worker", MockWorker);

describe("Platform Backends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
    mockListen.mockReset().mockResolvedValue(() => {});
  });

  describe("Desktop Parser Backend", () => {
    it("should initialize with platform 'desktop'", () => {
      const backend = createDesktopParserBackend();
      expect(backend.platform).toBe("desktop");
    });

    it("should call open_log when openFile is called with a string", async () => {
      const backend = createDesktopParserBackend();
      mockInvoke.mockResolvedValue({ file_name: "test.bin" });
      
      await backend.openFile("test.bin");
      expect(mockInvoke).toHaveBeenLastCalledWith("open_log", { path: "test.bin" }, undefined);
    });

    it("should call open_bytes when openFile is called with a File", async () => {
      const backend = createDesktopParserBackend();
      mockInvoke.mockResolvedValue({ file_name: "uploaded.bin" });
      
      const file = new File([new Uint8Array([1, 2, 3])], "test.bin");
      await backend.openFile(file);
      expect(mockInvoke).toHaveBeenLastCalledWith("open_bytes", { data: [1, 2, 3] }, undefined);
    });

    it("should call close_log when closeLog is called", async () => {
      const backend = createDesktopParserBackend();
      mockInvoke.mockResolvedValue(undefined);
      
      await backend.closeLog();
      expect(mockInvoke).toHaveBeenLastCalledWith("close_log", {}, undefined);
    });

    it("should call list_message_types when listMessageTypes is called", async () => {
      const backend = createDesktopParserBackend();
      mockInvoke.mockResolvedValue([]);
      
      await backend.listMessageTypes();
      expect(mockInvoke).toHaveBeenLastCalledWith("list_message_types", {}, undefined);
    });

    it("should call load_message_types when loadMessageTypes is called", async () => {
      const backend = createDesktopParserBackend();
      mockInvoke.mockResolvedValue(undefined);
      
      await backend.loadMessageTypes(["ATT", "GPS"]);
      expect(mockInvoke).toHaveBeenLastCalledWith("load_message_types", { names: ["ATT", "GPS"] }, undefined);
    });

    it("should call get_field_series when getFieldSeries is called", async () => {
      const backend = createDesktopParserBackend();
      mockInvoke.mockResolvedValue({ type: "numeric", values: [] });
      
      await backend.getFieldSeries({ messageType: "GPS", field: "Lat" });
      expect(mockInvoke).toHaveBeenLastCalledWith("get_field_series", {
        typeName: "GPS",
        field: "Lat",
        instance: null,
      }, undefined);
    });
  });

  describe("Web Parser Backend", () => {
    it("should initialize with platform 'web'", () => {
      const backend = createWebParserBackend();
      expect(backend.platform).toBe("web");
    });

    it("should throw error when openFile is called with a string", async () => {
      const backend = createWebParserBackend();
      await expect(backend.openFile("test.bin")).rejects.toThrow(
        "Opening file by path is not supported on web platform"
      );
    });
  });
});
