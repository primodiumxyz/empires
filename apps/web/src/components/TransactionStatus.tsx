import React, { useCallback, useEffect, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Loader } from "@/components/core/Loader";

type Transaction = {
  id: string;
  type: string | undefined;
  status: "pending" | "completed" | "error" | "removing";
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
      onChange: () => {
        const entities = tables.TransactionQueue.getAll();
        const newTransactions = entities.map((entity) => {
          const transaction = tables.TransactionQueue.get(entity);

          return {
            id: entity,
            type: transaction?.type || "Unknown",
            status: transaction?.pending ? ("pending" as const) : ("completed" as const),
          };
        });

        setTransactions((prevTransactions) => {
          const updatedTransactions = prevTransactions.map((tx) => {
            if (!newTransactions.some((newTx) => newTx.id === tx.id)) {
              return { ...tx, status: "completed" as const, completedAt: Date.now() };
            }

            return tx;
          });

          return [
            ...newTransactions.filter((newTx) => !prevTransactions.some((tx) => tx.id === newTx.id)),
            ...updatedTransactions,
          ];
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [tables.TransactionQueue]);

  useEffect(() => {
    transactions.forEach((transaction) => {
      if (transaction.status === "completed" && transaction.completedAt) {
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
      {transaction.status === "completed" && (
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
    </div>
  );
};
