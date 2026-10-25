import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { webcrypto } from "node:crypto";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";

Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
// jsdom's legacy File/Blob omit arrayBuffer(); use standards-compatible Node implementations.
Object.defineProperty(globalThis, "Blob", { configurable: true, value: NodeBlob });
Object.defineProperty(globalThis, "File", { configurable: true, value: NodeFile });

afterEach(() => cleanup());
