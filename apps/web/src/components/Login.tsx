import { useBurnerAccount } from "@/hooks/useBurnerAccount";
import { usePrivy } from "@privy-io/react-auth";

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
        className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Log in with Privy
      </button>
      {DEV && (
        <button
          onClick={() => createBurner()}
          className="bg-secondary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          (Dev only) Play with Burner Account
        </button>
      )}
      {usingBurner && (
        <button onClick={cancelBurner} className="bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Cancel Burner Account
        </button>
      )}
    </div>
  );
}

export default Login;
