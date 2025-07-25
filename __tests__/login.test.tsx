import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginForm from "../src/app/login/page";

describe("LoginPage", () => {
  it("should render the login form", () => {
    // Placeholder for login form render test
  });

  // Unit test for <LoginForm />
  it("should show error if email is empty", () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(submitButton);

    const errorMessage = screen.getByText(/email is required/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
