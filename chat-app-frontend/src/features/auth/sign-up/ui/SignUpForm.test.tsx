import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SignUpForm } from "./SignUpForm";

// Stand in for the real mutation: `register(data)` simulates a successful
// signup by invoking the onSuccess callback the form passes in.
vi.mock("../model/useSignUp", () => ({
  useSignUp: (options?: { onSuccess?: (email: string) => void }) => ({
    register: (data: { email: string }) => options?.onSuccess?.(data.email),
    isPending: false,
    error: null,
  }),
}));

async function fillAndSubmit(email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Full Name"), "John Doe");
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Username"), "johndoe");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Create an account" }));
  return user;
}

describe("SignUpForm — email confirmation notice", () => {
  it("shows the check-email alert after a successful signup", async () => {
    render(
      <MemoryRouter>
        <SignUpForm />
      </MemoryRouter>,
    );

    await fillAndSubmit("john@example.com");

    expect(await screen.findByText(/confirm your email/i)).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("does not show the alert before signing up", () => {
    render(
      <MemoryRouter>
        <SignUpForm />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/confirm your email/i)).not.toBeInTheDocument();
  });

  it("hides the alert when dismissed", async () => {
    render(
      <MemoryRouter>
        <SignUpForm />
      </MemoryRouter>,
    );

    const user = await fillAndSubmit("john@example.com");
    expect(await screen.findByText(/confirm your email/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText(/confirm your email/i)).not.toBeInTheDocument();
  });
});
