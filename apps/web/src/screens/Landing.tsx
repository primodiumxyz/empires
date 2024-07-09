import { usePrivy } from "@privy-io/react-auth";

import { useSyncStatus } from "@primodiumxyz/core/react";
import Core from "@/components/Core";
import Login from "@/components/Login";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";

const Landing = () => {
  const { ready, authenticated } = usePrivy();
  const { value, usingBurner } = useBurnerAccount();
  const { loading, progress } = useSyncStatus();

  if (!ready || loading) {
    // Do nothing while the PrivyProvider initializes with updated user state
    return <>Syncing {Math.floor(progress * 100)}%</>;
  }

  if ((!usingBurner && !authenticated) || (usingBurner && value === null)) {
    // Replace this code with however you'd like to handle an unauthenticated user
    // As an example, you might redirect them to a login page
    return <Login />;
  }

  if (authenticated || (usingBurner && value)) {
    // Replace this code with however you'd like to handle an authenticated user
    return <Core />;
  }
};

export default Landing;
