import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeExperience } from "./home-experience";

describe("M0 homepage", () => {
  it("makes the demo nature of the timeline explicit", () => {
    render(<HomeExperience />);
    expect(screen.getByText(/示例内容|虚构示例/)).toBeInTheDocument();
    expect(screen.getByText(/不会保存到本地数据库/)).toBeInTheDocument();
  });

  it("switches languages and filters the example timeline", () => {
    render(<HomeExperience />);
    const filterGroup = screen.getByRole("group", { name: "筛选事件类别" });
    fireEvent.click(within(filterGroup).getByRole("button", { name: "重要时刻" }));
    expect(screen.getByText("毕业，也是一次出发")).toBeInTheDocument();
    expect(screen.queryByText("写给未来的第一封信")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(screen.getByRole("heading", { name: /A life is more than a résumé/ })).toBeInTheDocument();
    expect(screen.getByText("Graduation, and a new beginning")).toBeInTheDocument();
    expect(screen.queryByText("A letter to my future self")).not.toBeInTheDocument();
  });
});
