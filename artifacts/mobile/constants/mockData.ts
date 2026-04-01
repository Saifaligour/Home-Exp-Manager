/**
 * Mock / seed data for HomeVault
 * Simulates fake API responses — all stored locally via AsyncStorage.
 * Replace this with real API calls when a backend is ready.
 */

import { type Vault, type Transaction, type VaultMember } from "@/context/VaultContext";

function id() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ─── Mock API responses ────────────────────────────────────────────────────────

export const MOCK_USERS = [
  { id: "user_demo", name: "Rahul Sharma", email: "rahul@example.com", phone: "+91 9876543210" },
  { id: "user_demo2", name: "Priya Patel", email: "priya@example.com", phone: "+91 9988776655" },
];

export function mockLoginResponse(identifier: string) {
  const isEmail = identifier.includes("@");
  const name = isEmail
    ? identifier.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : `User ${identifier.slice(-4)}`;
  const userId = "user_" + Date.now().toString(36);
  return {
    success: true,
    token: `mock_token_${userId}`,
    user: {
      id: userId,
      name,
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
    },
  };
}

export function mockRegisterResponse(name: string, email?: string, phone?: string) {
  const userId = "user_" + Date.now().toString(36);
  return {
    success: true,
    token: `mock_token_${userId}`,
    user: { id: userId, name, email, phone },
  };
}

// ─── Seed vaults & transactions for a new user ───────────────────────────────

export function buildSeedData(userId: string, userName: string): Vault[] {
  const owner: VaultMember = {
    id: id(),
    userId,
    name: userName,
    role: "admin",
    joinedAt: daysAgo(60),
  };

  const spouseId = id();
  const spouse: VaultMember = {
    id: id(),
    userId: spouseId,
    name: "Spouse / Partner",
    role: "admin",
    joinedAt: daysAgo(58),
  };

  // ── Main Vault 1: Family Home ─────────────────────────────────────────────
  const mainId1 = id();

  const homeExpenses: Transaction[] = [
    { id: id(), vaultId: "", type: "credit", amount: 50000, description: "Monthly salary credited", createdById: userId, createdByName: userName, createdAt: daysAgo(2), balanceAfter: 50000 },
    { id: id(), vaultId: "", type: "debit", amount: 12000, description: "Rent payment - June", createdById: userId, createdByName: userName, createdAt: daysAgo(3), balanceAfter: 38000 },
    { id: id(), vaultId: "", type: "debit", amount: 4500, description: "Electricity bill", createdById: userId, createdByName: userName, createdAt: daysAgo(5), balanceAfter: 33500 },
    { id: id(), vaultId: "", type: "debit", amount: 1800, description: "Water & maintenance", createdById: userId, createdByName: userName, createdAt: daysAgo(7), balanceAfter: 31700 },
    { id: id(), vaultId: "", type: "debit", amount: 6200, description: "Grocery shopping - D-Mart", createdById: userId, createdByName: userName, createdAt: daysAgo(8), balanceAfter: 25500 },
    { id: id(), vaultId: "", type: "credit", amount: 5000, description: "Bonus received", createdById: userId, createdByName: userName, createdAt: daysAgo(10), balanceAfter: 30500 },
    { id: id(), vaultId: "", type: "debit", amount: 3200, description: "Internet + OTT subscriptions", createdById: userId, createdByName: userName, createdAt: daysAgo(12), balanceAfter: 27300 },
  ];

  const mainVault1: Vault = {
    id: mainId1,
    name: "Family Home",
    description: "Primary household finances",
    icon: "🏠",
    color: "#D4A843",
    balance: homeExpenses.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0),
    isMain: true,
    ownerId: userId,
    createdAt: daysAgo(60),
    transactions: homeExpenses.map((t) => ({ ...t, vaultId: mainId1 })),
    members: [owner, spouse],
  };

  // ── Sub-vault 1a: Construction ────────────────────────────────────────────
  const constId = id();
  const constTxns: Transaction[] = [
    { id: id(), vaultId: constId, type: "credit", amount: 200000, description: "Construction budget allocated", createdById: userId, createdByName: userName, createdAt: daysAgo(45), balanceAfter: 200000 },
    { id: id(), vaultId: constId, type: "debit", amount: 45000, description: "Bricks & cement - Ravi Traders", createdById: userId, createdByName: userName, createdAt: daysAgo(40), balanceAfter: 155000 },
    { id: id(), vaultId: constId, type: "debit", amount: 28000, description: "Labour charges - Week 1", createdById: userId, createdByName: userName, createdAt: daysAgo(35), balanceAfter: 127000 },
    { id: id(), vaultId: constId, type: "debit", amount: 18500, description: "Steel rods - Shyam Steel", createdById: userId, createdByName: userName, createdAt: daysAgo(30), balanceAfter: 108500 },
    { id: id(), vaultId: constId, type: "credit", amount: 50000, description: "Bank loan disbursement", createdById: userId, createdByName: userName, createdAt: daysAgo(25), balanceAfter: 158500 },
    { id: id(), vaultId: constId, type: "debit", amount: 32000, description: "Plumbing work - Phase 1", createdById: userId, createdByName: userName, createdAt: daysAgo(20), balanceAfter: 126500 },
    { id: id(), vaultId: constId, type: "debit", amount: 15000, description: "Electrical wiring material", createdById: userId, createdByName: userName, createdAt: daysAgo(15), balanceAfter: 111500 },
    { id: id(), vaultId: constId, type: "debit", amount: 22000, description: "Tiles & flooring - Phase 1", createdById: userId, createdByName: userName, createdAt: daysAgo(8), balanceAfter: 89500 },
  ];
  const constVault: Vault = {
    id: constId,
    name: "House Construction",
    description: "New house building project",
    icon: "🏗️",
    color: "#5B8EF0",
    balance: constTxns.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0),
    isMain: false,
    parentId: mainId1,
    ownerId: userId,
    createdAt: daysAgo(45),
    transactions: constTxns,
    members: [owner],
  };

  // ── Sub-vault 1b: Marriage ─────────────────────────────────────────────────
  const marriageId = id();
  const marriageTxns: Transaction[] = [
    { id: id(), vaultId: marriageId, type: "credit", amount: 100000, description: "Marriage savings - initial", createdById: userId, createdByName: userName, createdAt: daysAgo(50), balanceAfter: 100000 },
    { id: id(), vaultId: marriageId, type: "credit", amount: 25000, description: "Family contribution", createdById: userId, createdByName: userName, createdAt: daysAgo(30), balanceAfter: 125000 },
    { id: id(), vaultId: marriageId, type: "debit", amount: 15000, description: "Venue booking advance", createdById: userId, createdByName: userName, createdAt: daysAgo(20), balanceAfter: 110000 },
    { id: id(), vaultId: marriageId, type: "debit", amount: 8000, description: "Catering sample event", createdById: userId, createdByName: userName, createdAt: daysAgo(10), balanceAfter: 102000 },
    { id: id(), vaultId: marriageId, type: "debit", amount: 4500, description: "Invitation cards printing", createdById: userId, createdByName: userName, createdAt: daysAgo(5), balanceAfter: 97500 },
  ];
  const marriageVault: Vault = {
    id: marriageId,
    name: "Marriage",
    description: "Wedding planning & expenses",
    icon: "💒",
    color: "#E91E63",
    balance: marriageTxns.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0),
    isMain: false,
    parentId: mainId1,
    ownerId: userId,
    createdAt: daysAgo(50),
    transactions: marriageTxns,
    members: [owner, spouse],
  };

  // ── Sub-vault 1c: Car ─────────────────────────────────────────────────────
  const carId = id();
  const carTxns: Transaction[] = [
    { id: id(), vaultId: carId, type: "credit", amount: 80000, description: "Car down payment saved", createdById: userId, createdByName: userName, createdAt: daysAgo(90), balanceAfter: 80000 },
    { id: id(), vaultId: carId, type: "debit", amount: 70000, description: "Car purchase - Maruti Suzuki Swift", createdById: userId, createdByName: userName, createdAt: daysAgo(85), balanceAfter: 10000 },
    { id: id(), vaultId: carId, type: "debit", amount: 2800, description: "Car insurance premium", createdById: userId, createdByName: userName, createdAt: daysAgo(30), balanceAfter: 7200 },
    { id: id(), vaultId: carId, type: "debit", amount: 1500, description: "Servicing - 10,000 km", createdById: userId, createdByName: userName, createdAt: daysAgo(15), balanceAfter: 5700 },
    { id: id(), vaultId: carId, type: "credit", amount: 3000, description: "Fuel reimbursement - office", createdById: userId, createdByName: userName, createdAt: daysAgo(7), balanceAfter: 8700 },
  ];
  const carVault: Vault = {
    id: carId,
    name: "Car & Transport",
    description: "Vehicle expenses",
    icon: "🚗",
    color: "#2ECC8A",
    balance: carTxns.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0),
    isMain: false,
    parentId: mainId1,
    ownerId: userId,
    createdAt: daysAgo(90),
    transactions: carTxns,
    members: [owner],
  };

  // ── Main Vault 2: Business ────────────────────────────────────────────────
  const mainId2 = id();
  const bizTxns: Transaction[] = [
    { id: id(), vaultId: mainId2, type: "credit", amount: 150000, description: "Client payment - Project Alpha", createdById: userId, createdByName: userName, createdAt: daysAgo(14), balanceAfter: 150000 },
    { id: id(), vaultId: mainId2, type: "debit", amount: 22000, description: "Office rent - May", createdById: userId, createdByName: userName, createdAt: daysAgo(12), balanceAfter: 128000 },
    { id: id(), vaultId: mainId2, type: "debit", amount: 8500, description: "Staff salary - Ajay", createdById: userId, createdByName: userName, createdAt: daysAgo(10), balanceAfter: 119500 },
    { id: id(), vaultId: mainId2, type: "credit", amount: 75000, description: "Client payment - Project Beta", createdById: userId, createdByName: userName, createdAt: daysAgo(6), balanceAfter: 194500 },
    { id: id(), vaultId: mainId2, type: "debit", amount: 12000, description: "Equipment purchase - laptop", createdById: userId, createdByName: userName, createdAt: daysAgo(4), balanceAfter: 182500 },
    { id: id(), vaultId: mainId2, type: "debit", amount: 4200, description: "Office supplies & stationery", createdById: userId, createdByName: userName, createdAt: daysAgo(2), balanceAfter: 178300 },
  ];
  const mainVault2: Vault = {
    id: mainId2,
    name: "My Business",
    description: "Business income & expenses",
    icon: "🏦",
    color: "#9B59B6",
    balance: bizTxns.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0),
    isMain: true,
    ownerId: userId,
    createdAt: daysAgo(30),
    transactions: bizTxns.map((t) => ({ ...t, vaultId: mainId2 })),
    members: [owner],
  };

  // ── Sub-vault 2a: Education ───────────────────────────────────────────────
  const eduId = id();
  const eduTxns: Transaction[] = [
    { id: id(), vaultId: eduId, type: "credit", amount: 30000, description: "Education fund deposit", createdById: userId, createdByName: userName, createdAt: daysAgo(30), balanceAfter: 30000 },
    { id: id(), vaultId: eduId, type: "debit", amount: 12000, description: "Online course - React Native", createdById: userId, createdByName: userName, createdAt: daysAgo(20), balanceAfter: 18000 },
    { id: id(), vaultId: eduId, type: "debit", amount: 3500, description: "Books & study material", createdById: userId, createdByName: userName, createdAt: daysAgo(10), balanceAfter: 14500 },
  ];
  const eduVault: Vault = {
    id: eduId,
    name: "Education",
    description: "Learning & skill development",
    icon: "🎓",
    color: "#E67E22",
    balance: eduTxns.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0),
    isMain: false,
    parentId: mainId2,
    ownerId: userId,
    createdAt: daysAgo(30),
    transactions: eduTxns,
    members: [owner],
  };

  return [mainVault1, constVault, marriageVault, carVault, mainVault2, eduVault];
}
