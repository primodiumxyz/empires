import { Address } from "viem";

import { useUsername } from "@/hooks/useUsername";
import { cn } from "@/util/client";

export const Username = ({ address, className }: { address: Address; className?: string }) => {
  const { username, hasTwitter } = useUsername(address);

  if (!hasTwitter) return <p className={cn("lg:text-sm", className)}>{username}</p>;

  return (
    <a
      href={`https://x.com/${username}`}
      className={cn("pointer-events-auto underline lg:text-sm", className)}
      target="_blank"
      rel="noreferrer"
    >
      {username}
    </a>
  );
};
