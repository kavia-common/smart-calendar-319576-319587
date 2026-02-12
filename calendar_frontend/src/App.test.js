import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Smart Calendar header", () => {
  render(<App />);
  const heading = screen.getByText(/smart calendar/i);
  expect(heading).toBeInTheDocument();
});
