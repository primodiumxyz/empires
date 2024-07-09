import { usePrivy } from "@privy-io/react-auth";

import { useBurnerAccount } from "@/hooks/useBurnerAccount";

function Login() {
  const { ready, authenticated, login } = usePrivy();
  // Disable login when Privy is not ready or the user is already authenticated
  const disableLogin = !ready || (ready && authenticated);
  const { createBurner, cancelBurner, usingBurner } = useBurnerAccount();

  const DEV = import.meta.env.PRI_DEV === "true";

  return (
    <div className="flex flex-col gap-2">
      <button
        disabled={disableLogin}
        onClick={login}
        className="rounded bg-primary px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Log in with Privy
      </button>
      {DEV && (
        <button
          onClick={() => createBurner()}
          className="rounded bg-secondary px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          (Dev only) Play with Burner Account
        </button>
      )}
      {usingBurner && (
        <button onClick={cancelBurner} className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
          Cancel Burner Account
        </button>
      )}
    </div>
  );
}

export default Login;
