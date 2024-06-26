import Core from "@/components/Core";
import Login from "@/components/Login";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";
import { usePrivy } from "@privy-io/react-auth";

const Landing = () => {
  const { ready, authenticated } = usePrivy();
  const { value, usingBurner } = useBurnerAccount();
  console.log({ ready, authenticated, value, usingBurner });

  if (!ready) {
    console.log("initializing");
    // Do nothing while the PrivyProvider initializes with updated user state
    return <></>;
  }

  if ((!usingBurner && !authenticated) || (usingBurner && value === null)) {
    console.log("login");
    // Replace this code with however you'd like to handle an unauthenticated user
    // As an example, you might redirect them to a login page
    return <Login />;
  }

  if (authenticated || (usingBurner && value)) {
    console.log("core");
    // Replace this code with however you'd like to handle an authenticated user
    return <Core />;
  }
};

export default Landing;
