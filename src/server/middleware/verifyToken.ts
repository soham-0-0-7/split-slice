import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "please-set-a-secret";

export function verifyTokenFromHeader(authHeader?: string) {
  if (!authHeader) throw new Error("Missing Authorization header");
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    throw new Error("Invalid Authorization header");
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { username: string; userid: number };
  } catch (err) {
    throw new Error("Invalid token");
  }
}

export default verifyTokenFromHeader;
