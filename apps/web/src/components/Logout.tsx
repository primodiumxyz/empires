import { usePrivy } from "@privy-io/react-auth";

import { useBurnerAccount } from "@/hooks/useBurnerAccount";

export const Logout = () => {
  const { logout } = usePrivy();
  const { cancelBurner, usingBurner } = useBurnerAccount();
  const handleLogout = async () => {
    if (usingBurner) cancelBurner();
    else await logout();
  };
  return (
    <button onClick={handleLogout} className="btn btn-primary absolute left-4 top-4">
      Logout
    </button>
  );
};
