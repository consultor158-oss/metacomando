import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "../components/Dashboard";
import { LoginGate } from "../components/LoginGate";

export const Route = createFileRoute("/")({
  component: GatedDashboard,
});

function GatedDashboard() {
  return (
    <LoginGate>
      <Dashboard />
    </LoginGate>
  );
}
