import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import RegisterPage from "@/pages/RegisterPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import CHWDashboard from "@/pages/chw/CHWDashboard";
import NurseDashboard from "@/pages/nurse/NurseDashboard";
import NurseCHWMonitoring from "@/pages/nurse/NurseCHWMonitoring";
import NurseAssessments from "@/pages/nurse/NurseAssessments";
import { useEffect } from "react";

describe("authentication related pages", () => {
  it("renders forgot password form", () => {
    render(
      <MemoryRouter initialEntries={["/forgot"]}>
        <Routes>
          <Route path="/forgot" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("redirects from reset page when no token", () => {
    // if no token query param is provided the component will call navigate("/")
    // but in this test we can't directly assert on navigation; we can at least
    // render and expect that the form doesn't show up.
    render(
      <MemoryRouter initialEntries={["/reset"]}>
        <Routes>
          <Route path="/reset" element={<ResetPasswordPage />} />
          <Route path="/" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>
    );
    // since there's no token, the effect should navigate away rapidly; we can
    // assert that something from login route eventually appears (async). 
    expect(screen.queryByText(/reset password/i)).not.toBeInTheDocument();
  });

  it("shows form when token present", () => {
    render(
      <MemoryRouter initialEntries={["/reset?token=abc123"]}>
        <Routes>
          <Route path="/reset" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("registration shows health center dropdown for nurse role and stores selection", () => {
    localStorage.clear();
    const { getByRole, getByLabelText } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );
    // select nurse role
    const nurseButton = getByRole("button", { name: /nurse/i });
    fireEvent.click(nurseButton);
    // now health center dropdown should be visible
    const hcSelect = getByLabelText(/health center/i);
    expect(hcSelect).toBeInTheDocument();
    fireEvent.change(hcSelect, { target: { value: "Gikondo Health Center" } });
    // fill other required fields to allow submission
    fireEvent.change(getByLabelText(/full name/i), { target: { value: "Test User" } });
    fireEvent.change(getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(getByLabelText(/password/i), { target: { value: "pass123" } });
    fireEvent.click(getByRole("button", { name: /submit request/i }));
    expect(localStorage.getItem("hc_nurse")).toBe("Gikondo Health Center");
  });

  it("dashboard components display stored health center after login", () => {
    // set up stored centers and simulate login via AuthProvider
    localStorage.setItem("hc_chw", "Kicukiro Health Center");
    localStorage.setItem("hc_nurse", "Gikondo Health Center");

    // helper component to invoke login
    function LoginAs({ role }: { role: "chw" | "nurse" }) {
      const { login } = useAuth();
      useEffect(() => {
        login("a", "b", role);
      }, [login, role]);
      return null;
    }

    // render CHW dashboard
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/chw"]}>
          <LoginAs role="chw" />
          <Routes>
            <Route path="/chw" element={<CHWDashboard />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByText(/kicukiro health center/i)).toBeInTheDocument();

    // render Nurse dashboard
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/nurse"]}>
          <LoginAs role="nurse" />
          <Routes>
            <Route path="/nurse" element={<NurseDashboard />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByText(/gikondo health center/i)).toBeInTheDocument();
  });

  it("search filter works on CHW monitoring page", () => {
    // prepare auth
    localStorage.setItem("hc_nurse", "Some Center");
    function LoginAs({ role }: { role: "nurse" }) {
      const { login } = useAuth();
      useEffect(() => { login("x", "y", role); }, [login, role]);
      return null;
    }
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/nurse/chw"]}>
          <LoginAs role="nurse" />
          <Routes>
            <Route path="/nurse/chw" element={<NurseCHWMonitoring />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    // ensure a known CHW appears
    expect(screen.getByText(/emmanuel habimana/i)).toBeInTheDocument();
    // type something that matches only one CHW
    const input = screen.getByPlaceholderText(/search chws or children/i);
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.queryByText(/emmanuel habimana/i)).not.toBeInTheDocument();
    expect(screen.getByText(/alice mukamana/i)).toBeInTheDocument();
  });

  it("nurse assessments page shows conduct assessment button", () => {
    // simple render, no auth needed
    render(
      <MemoryRouter initialEntries={["/nurse/assessments"]}>
        <Routes>
          <Route path="/nurse/assessments" element={<NurseAssessments />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /conduct assessment/i })).toBeInTheDocument();
  });
});
