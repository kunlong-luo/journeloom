import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarkdownPreview from "./markdown-preview";

describe("private Markdown rendering", () => {
  it("does not fetch remote images simply by showing a private draft", () => {
    render(<MarkdownPreview content="Private notes ![my child](https://example.com/tracker.png)" />);
    expect(screen.getByText(/图片引用：my child/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
