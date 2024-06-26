import { usePrivy } from "@privy-io/react-auth";

function Login() {
  const { ready, authenticated, login } = usePrivy();
  // Disable login when Privy is not ready or the user is already authenticated
  const disableLogin = !ready || (ready && authenticated);

  return (
    <button
      disabled={disableLogin}
      onClick={login}
      className="bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Log in
    </button>
  );
}

export default Login;
