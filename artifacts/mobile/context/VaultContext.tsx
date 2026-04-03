import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface Transaction {
  id: string;
  vaultId: string;
  type: "credit" | "debit" | "transfer";
  amount: number;
  description: string;
  imageUrl?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  balanceAfter: number;
  /** Set on transfer-out transaction (main vault side) */
  transferToVaultId?: string;
  /** Set on transfer-in transaction (child vault side) */
  transferFromVaultId?: string;
}

export interface VaultMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "member";
  joinedAt: string;
}

export interface Vault {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  balance: number;
  isMain: boolean;
  parentId?: string;
  ownerId: string;
  createdAt: string;
  transactions: Transaction[];
  members: VaultMember[];
}

/** Derived stats for a vault — computed from its transactions */
export interface VaultStats {
  totalIn: number;       // sum of credits
  totalOut: number;      // sum of debits
  totalAllocated: number; // sum of transfers OUT (main vault only)
  totalReceived: number;  // sum of transfers IN (child vault only)
  available: number;     // current balance
  budget: number;        // for child: total received; for main: totalIn
  spent: number;         // for child: totalOut; for main: totalOut + totalAllocated
}

interface VaultContextValue {
  vaults: Vault[];
  mainVault: Vault | undefined;
  mainVaults: Vault[];
  isLoading: boolean;
  createVault: (data: CreateVaultData) => Promise<Vault>;
  updateVault: (id: string, data: Partial<Vault>) => Promise<void>;
  deleteVault: (id: string) => Promise<void>;
  addTransaction: (
    vaultId: string,
    data: AddTransactionData
  ) => Promise<Transaction>;
  transferToChild: (data: TransferData) => Promise<void>;
  deleteTransaction: (
    vaultId: string,
    transactionId: string
  ) => Promise<void>;
  addMember: (vaultId: string, member: VaultMember) => Promise<void>;
  removeMember: (vaultId: string, memberId: string) => Promise<void>;
  searchTransactions: (query: string) => Transaction[];
  refreshVaults: () => Promise<void>;
  seedVaults: (data: Vault[]) => Promise<void>;
  getVaultStats: (vault: Vault) => VaultStats;
}

interface CreateVaultData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  initialBalance?: number;
  isMain?: boolean;
  parentId?: string;
  ownerId: string;
  ownerName: string;
}

interface AddTransactionData {
  type: "credit" | "debit";
  amount: number;
  description: string;
  imageUrl?: string;
  userId: string;
  userName: string;
}

interface TransferData {
  fromVaultId: string;
  toVaultId: string;
  amount: number;
  description?: string;
  userId: string;
  userName: string;
}

const VaultContext = createContext<VaultContextValue | null>(null);

const VAULTS_KEY = "@home_vault_vaults";

const VAULT_ICONS = ["🏠", "🏗️", "💒", "🚗", "🎓", "🏥", "✈️", "🛒"];
const VAULT_COLORS = [
  "#D4A843",
  "#2ECC8A",
  "#5B8EF0",
  "#E85C5C",
  "#9B59B6",
  "#E67E22",
  "#1ABC9C",
  "#E91E63",
];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVaults = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(VAULTS_KEY);
      if (stored) {
        setVaults(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  const saveVaults = useCallback(async (updated: Vault[]) => {
    await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(updated));
    setVaults(updated);
  }, []);

  const createVault = useCallback(
    async (data: CreateVaultData): Promise<Vault> => {
      const newVault: Vault = {
        id: generateId(),
        name: data.name,
        description: data.description,
        icon: data.icon || randomFrom(VAULT_ICONS),
        color: data.color || randomFrom(VAULT_COLORS),
        balance: data.initialBalance || 0,
        isMain: data.isMain || false,
        parentId: data.parentId,
        ownerId: data.ownerId,
        createdAt: new Date().toISOString(),
        transactions:
          data.initialBalance && data.initialBalance > 0
            ? [
                {
                  id: generateId(),
                  vaultId: "",
                  type: "credit",
                  amount: data.initialBalance,
                  description: "Initial balance",
                  createdById: data.ownerId,
                  createdByName: data.ownerName,
                  createdAt: new Date().toISOString(),
                  balanceAfter: data.initialBalance,
                },
              ]
            : [],
        members: [
          {
            id: generateId(),
            userId: data.ownerId,
            name: data.ownerName,
            role: "admin",
            joinedAt: new Date().toISOString(),
          },
        ],
      };

      if (newVault.transactions.length > 0) {
        newVault.transactions[0].vaultId = newVault.id;
      }

      const updated = [...vaults, newVault];
      await saveVaults(updated);
      return newVault;
    },
    [vaults, saveVaults]
  );

  const updateVault = useCallback(
    async (id: string, data: Partial<Vault>) => {
      const updated = vaults.map((v) => (v.id === id ? { ...v, ...data } : v));
      await saveVaults(updated);
    },
    [vaults, saveVaults]
  );

  const deleteVault = useCallback(
    async (id: string) => {
      const updated = vaults.filter(
        (v) => v.id !== id && v.parentId !== id
      );
      await saveVaults(updated);
    },
    [vaults, saveVaults]
  );

  const addTransaction = useCallback(
    async (vaultId: string, data: AddTransactionData): Promise<Transaction> => {
      const vault = vaults.find((v) => v.id === vaultId);
      if (!vault) throw new Error("Vault not found");

      // Main vault: direct debits are not allowed — it is a fund source only
      if (vault.isMain && data.type === "debit") {
        throw new Error(
          "MAIN_VAULT_NO_DEBIT: Spending is not allowed directly from a Main Vault. Use 'Allocate' to move funds to a sub-vault first."
        );
      }

      // Child vault: block spending if there is not enough balance
      if (!vault.isMain && data.type === "debit" && vault.balance < data.amount) {
        throw new Error(
          `INSUFFICIENT_BALANCE: Not enough funds. Sub-vault balance is ₹${vault.balance.toLocaleString("en-IN")}. Transfer more from the Main Vault first.`
        );
      }

      const newBalance =
        data.type === "credit"
          ? vault.balance + data.amount
          : vault.balance - data.amount;

      const tx: Transaction = {
        id: generateId(),
        vaultId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        imageUrl: data.imageUrl,
        createdById: data.userId,
        createdByName: data.userName,
        createdAt: new Date().toISOString(),
        balanceAfter: newBalance,
      };

      const updated = vaults.map((v) => {
        if (v.id === vaultId) {
          return {
            ...v,
            balance: newBalance,
            transactions: [tx, ...v.transactions],
          };
        }
        return v;
      });

      await saveVaults(updated);
      return tx;
    },
    [vaults, saveVaults]
  );

  /**
   * Atomically moves `amount` from a main vault to a child vault.
   * - Creates a "transfer" type transaction on the main vault (deducts balance)
   * - Creates a "transfer" type transaction on the child vault (adds balance)
   */
  const transferToChild = useCallback(
    async (data: TransferData) => {
      const fromVault = vaults.find((v) => v.id === data.fromVaultId);
      const toVault = vaults.find((v) => v.id === data.toVaultId);
      if (!fromVault || !toVault) throw new Error("Vault not found");
      if (fromVault.balance < data.amount) throw new Error("Insufficient balance");

      const label = data.description?.trim() || `Allocated to ${toVault.name}`;
      const now = new Date().toISOString();

      const fromNewBalance = fromVault.balance - data.amount;
      const toNewBalance = toVault.balance + data.amount;

      const txOut: Transaction = {
        id: generateId(),
        vaultId: data.fromVaultId,
        type: "transfer",
        amount: data.amount,
        description: label,
        createdById: data.userId,
        createdByName: data.userName,
        createdAt: now,
        balanceAfter: fromNewBalance,
        transferToVaultId: data.toVaultId,
      };

      const txIn: Transaction = {
        id: generateId(),
        vaultId: data.toVaultId,
        type: "transfer",
        amount: data.amount,
        description: `Received from ${fromVault.name}`,
        createdById: data.userId,
        createdByName: data.userName,
        createdAt: now,
        balanceAfter: toNewBalance,
        transferFromVaultId: data.fromVaultId,
      };

      const updated = vaults.map((v) => {
        if (v.id === data.fromVaultId) {
          return {
            ...v,
            balance: fromNewBalance,
            transactions: [txOut, ...v.transactions],
          };
        }
        if (v.id === data.toVaultId) {
          return {
            ...v,
            balance: toNewBalance,
            transactions: [txIn, ...v.transactions],
          };
        }
        return v;
      });

      await saveVaults(updated);
    },
    [vaults, saveVaults]
  );

  const deleteTransaction = useCallback(
    async (vaultId: string, transactionId: string) => {
      const vault = vaults.find((v) => v.id === vaultId);
      if (!vault) return;

      const tx = vault.transactions.find((t) => t.id === transactionId);
      if (!tx) return;

      const newBalance =
        tx.type === "credit" || tx.transferFromVaultId
          ? vault.balance - tx.amount
          : vault.balance + tx.amount;

      const updated = vaults.map((v) => {
        if (v.id === vaultId) {
          return {
            ...v,
            balance: Math.max(0, newBalance),
            transactions: v.transactions.filter((t) => t.id !== transactionId),
          };
        }
        return v;
      });

      await saveVaults(updated);
    },
    [vaults, saveVaults]
  );

  const addMember = useCallback(
    async (vaultId: string, member: VaultMember) => {
      const updated = vaults.map((v) => {
        if (v.id === vaultId) {
          const exists = v.members.some((m) => m.userId === member.userId);
          if (exists) return v;
          return { ...v, members: [...v.members, member] };
        }
        return v;
      });
      await saveVaults(updated);
    },
    [vaults, saveVaults]
  );

  const removeMember = useCallback(
    async (vaultId: string, memberId: string) => {
      const updated = vaults.map((v) => {
        if (v.id === vaultId) {
          return { ...v, members: v.members.filter((m) => m.id !== memberId) };
        }
        return v;
      });
      await saveVaults(updated);
    },
    [vaults, saveVaults]
  );

  const seedVaults = useCallback(
    async (data: Vault[]) => {
      await saveVaults(data);
    },
    [saveVaults]
  );

  const searchTransactions = useCallback(
    (query: string): Transaction[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      const results: Transaction[] = [];
      for (const vault of vaults) {
        for (const tx of vault.transactions) {
          if (
            tx.description.toLowerCase().includes(q) ||
            tx.amount.toString().includes(q) ||
            tx.createdByName.toLowerCase().includes(q) ||
            vault.name.toLowerCase().includes(q)
          ) {
            results.push(tx);
          }
        }
      }
      return results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    [vaults]
  );

  /**
   * Computes derived stats for any vault from its transaction history.
   */
  const getVaultStats = useCallback(
    (vault: Vault): VaultStats => {
      let totalIn = 0;
      let totalOut = 0;
      let totalAllocated = 0;
      let totalReceived = 0;

      for (const tx of vault.transactions) {
        if (tx.type === "credit") {
          totalIn += tx.amount;
        } else if (tx.type === "debit") {
          totalOut += tx.amount;
        } else if (tx.type === "transfer") {
          if (tx.transferToVaultId) {
            totalAllocated += tx.amount;
          } else if (tx.transferFromVaultId) {
            totalReceived += tx.amount;
          }
        }
      }

      if (vault.isMain) {
        // Sum all actual spending (debits) across every child vault
        const totalChildSpent = vaults
          .filter((v) => !v.isMain && v.parentId === vault.id)
          .reduce((sum, cv) => {
            return (
              sum +
              cv.transactions
                .filter((tx) => tx.type === "debit")
                .reduce((s, tx) => s + tx.amount, 0)
            );
          }, 0);
        const available = totalIn - totalChildSpent;
        return {
          totalIn,
          totalOut,
          totalAllocated,
          totalReceived,
          available,
          budget: totalIn,
          spent: totalChildSpent,
        };
      } else {
        const available = vault.balance;
        return {
          totalIn,
          totalOut,
          totalAllocated,
          totalReceived,
          available,
          budget: totalReceived,
          spent: totalOut,
        };
      }
    },
    [vaults]
  );

  const mainVaults = useMemo(() => vaults.filter((v) => v.isMain), [vaults]);
  const mainVault = useMemo(() => mainVaults[0], [mainVaults]);

  const value = useMemo(
    () => ({
      vaults,
      mainVault,
      mainVaults,
      isLoading,
      createVault,
      updateVault,
      deleteVault,
      addTransaction,
      transferToChild,
      deleteTransaction,
      addMember,
      removeMember,
      searchTransactions,
      refreshVaults: loadVaults,
      seedVaults,
      getVaultStats,
    }),
    [
      vaults,
      mainVault,
      mainVaults,
      isLoading,
      createVault,
      updateVault,
      deleteVault,
      addTransaction,
      transferToChild,
      deleteTransaction,
      addMember,
      removeMember,
      searchTransactions,
      loadVaults,
      seedVaults,
      getVaultStats,
    ]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVaults() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVaults must be used within VaultProvider");
  return ctx;
}
