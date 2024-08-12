import React, { useCallback, useEffect, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Loader } from "@/components/core/Loader";

type Transaction = {
  id: string;
  type: string | undefined;
  status: "pending" | "success" | "error" | "removing";
  completedAt?: number;
};

const FADEOUT_DELAY = 5000;

export const TransactionStatus: React.FC = () => {
  const { tables } = useCore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((t) => (t.id === id ? { ...t, status: "removing" } : t)),
    );

    setTimeout(() => {
      setTransactions((prevTransactions) => prevTransactions.filter((t) => t.id !== id));
    }, FADEOUT_DELAY);
  }, []);

  useEffect(() => {
    const unsubscribe = tables.TransactionQueue.watch({
      onEnter: ({ entity, properties: { current } }) => {
        setTransactions((prev) => [
          ...prev,
          {
            id: entity,
            type: current?.type || "Unknown",
            status: "pending",
          },
        ]);
      },
      onUpdate: ({ entity, properties: { current } }) => {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === entity
              ? {
                  ...tx,
                  status: current?.success ? "success" : "error",
                  completedAt: Date.now(),
                }
              : tx,
          ),
        );
      },
    });

    return () => {
      unsubscribe();
    };
  }, [tables.TransactionQueue]);

  useEffect(() => {
    transactions.forEach((transaction) => {
      if (transaction.completedAt) {
        const timeLeft = FADEOUT_DELAY - (Date.now() - transaction.completedAt);
        if (timeLeft > 0) {
          const timer = setTimeout(() => {
            removeTransaction(transaction.id);
          }, timeLeft);

          return () => clearTimeout(timer);
        } else {
          removeTransaction(transaction.id);
        }
      }
    });
  }, [transactions, removeTransaction]);

  return (
    <div className="min-w-42 flex flex-col gap-2 p-2 text-right text-xs">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className={`transition-all duration-300 ease-in-out ${
            transaction.status === "removing" ? "my-0 h-0 opacity-0" : "my-1 h-4 opacity-100"
          }`}
        >
          <TransactionItem transaction={transaction} />
        </div>
      ))}
    </div>
  );
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <span>{transaction.type}</span>
      {transaction.status === "pending" && <Loader size="xs" />}
      {transaction.status === "success" && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-green-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {transaction.status === "error" && (
        <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 0L14 10l-4.293 4.293a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
};
