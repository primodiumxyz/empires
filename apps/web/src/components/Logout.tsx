import { useBurnerAccount } from "@/hooks/useBurnerAccount";
import { usePrivy } from "@privy-io/react-auth";

export const Logout = () => {
  const { logout } = usePrivy();
  const { cancelBurner, usingBurner } = useBurnerAccount();
  const handleLogout = async () => {
    if (usingBurner) cancelBurner();
    else await logout();
  };
  return (
    <button onClick={handleLogout} className="absolute top-4 left-4 rounded-sm btn btn-primary">
      Logout
    </button>
  );
};
