/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
    ok: true,
  })
) as jest.Mock;

describe("ProfilePage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("renders all form fields", () => {
    render(<ProfilePage />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Birth Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty/invalid fields", async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Username must be at least 6 characters/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Must be a valid email format/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Phone must be 10-15 digits/i)).toBeInTheDocument();
  });

  it("shows validation error if bio exceeds 160 characters", async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Bio/i), {
      target: { value: "a".repeat(161) },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Bio must be 160 characters or less/i)
    ).toBeInTheDocument();
  });

  it("shows validation error if birth date is in the future", async () => {
    render(<ProfilePage />);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: futureDate.toISOString().split("T")[0] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Birth date cannot be in the future/i)
    ).toBeInTheDocument();
  });

  it("submits valid form and shows success message", async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });
});
