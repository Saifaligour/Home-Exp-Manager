import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
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
  type: "credit" | "debit";
  amount: number;
  description: string;
  imageUrl?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  balanceAfter: number;
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

interface VaultContextValue {
  vaults: Vault[];
  mainVault: Vault | undefined;
  isLoading: boolean;
  createVault: (data: CreateVaultData) => Promise<Vault>;
  updateVault: (id: string, data: Partial<Vault>) => Promise<void>;
  deleteVault: (id: string) => Promise<void>;
  addTransaction: (
    vaultId: string,
    data: AddTransactionData
  ) => Promise<Transaction>;
  deleteTransaction: (
    vaultId: string,
    transactionId: string
  ) => Promise<void>;
  addMember: (vaultId: string, member: VaultMember) => Promise<void>;
  removeMember: (vaultId: string, memberId: string) => Promise<void>;
  searchTransactions: (query: string) => Transaction[];
  refreshVaults: () => Promise<void>;
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

  const deleteTransaction = useCallback(
    async (vaultId: string, transactionId: string) => {
      const vault = vaults.find((v) => v.id === vaultId);
      if (!vault) return;

      const tx = vault.transactions.find((t) => t.id === transactionId);
      if (!tx) return;

      const newBalance =
        tx.type === "credit"
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

  const mainVault = useMemo(() => vaults.find((v) => v.isMain), [vaults]);

  const value = useMemo(
    () => ({
      vaults,
      mainVault,
      isLoading,
      createVault,
      updateVault,
      deleteVault,
      addTransaction,
      deleteTransaction,
      addMember,
      removeMember,
      searchTransactions,
      refreshVaults: loadVaults,
    }),
    [
      vaults,
      mainVault,
      isLoading,
      createVault,
      updateVault,
      deleteVault,
      addTransaction,
      deleteTransaction,
      addMember,
      removeMember,
      searchTransactions,
      loadVaults,
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
