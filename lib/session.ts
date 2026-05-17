import { SignJWT, jwtVerify } from "jose";

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
};

export type SessionPayload = { userId: number; isAdmin: boolean };

export async function signSession(userId: number, isAdmin: boolean): Promise<string> {
  return new SignJWT({ userId, isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "number") return null;
    return { userId: payload.userId as number, isAdmin: !!payload.isAdmin };
  } catch {
    return null;
  }
}
