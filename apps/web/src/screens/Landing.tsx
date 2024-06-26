import Core from "@/components/Core";
import Login from "@/components/Login";
import { usePrivy } from "@privy-io/react-auth";

const Landing = () => {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    // Do nothing while the PrivyProvider initializes with updated user state
    return <></>;
  }

  if (ready && !authenticated) {
    // Replace this code with however you'd like to handle an unauthenticated user
    // As an example, you might redirect them to a login page
    return <Login />;
  }

  if (ready && authenticated) {
    // Replace this code with however you'd like to handle an authenticated user
    return <Core />;
  }
};

export default Landing;
