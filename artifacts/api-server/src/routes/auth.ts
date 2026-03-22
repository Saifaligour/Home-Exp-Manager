import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/auth/login", (req, res) => {
  const { identifier, password } = req.body as {
    identifier: string;
    password: string;
  };

  if (!identifier || !password) {
    res.status(400).json({ error: "bad_request", message: "Missing fields" });
    return;
  }

  const userId = `user_${Date.now()}`;
  const name = identifier.includes("@")
    ? identifier.split("@")[0]
    : `User ${identifier.slice(-4)}`;

  res.json({
    token: `token_${userId}`,
    user: {
      id: userId,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: identifier.includes("@") ? identifier : undefined,
      phone: !identifier.includes("@") ? identifier : undefined,
      createdAt: new Date().toISOString(),
    },
  });
});

router.post("/auth/register", (req, res) => {
  const { name, email, phone, password } = req.body as {
    name: string;
    email?: string;
    phone?: string;
    password: string;
  };

  if (!name || !password) {
    res.status(400).json({ error: "bad_request", message: "Missing fields" });
    return;
  }

  const userId = `user_${Date.now()}`;
  res.status(201).json({
    token: `token_${userId}`,
    user: {
      id: userId,
      name,
      email,
      phone,
      createdAt: new Date().toISOString(),
    },
  });
});

export default router;
