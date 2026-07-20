import { render, screen } from "@testing-library/react";
import { NoSearchResults } from "./NoSearchResults";

describe("NoSearchResults", () => {
  it("names what was searched", () => {
    render(<NoSearchResults query="ali" noun="contacts" />);
    expect(screen.getByText("No contacts found")).toBeInTheDocument();
  });

  it("echoes the query back so a typo is visible", () => {
    render(<NoSearchResults query="jonh" noun="people" />);
    expect(screen.getByText(/jonh/)).toBeInTheDocument();
  });

  it("renders a query that would otherwise read as markup", () => {
    render(<NoSearchResults query="<script>" noun="people" />);
    expect(screen.getByText(/<script>/)).toBeInTheDocument();
  });
});
