import { SignJWT, jwtVerify } from 'jose';

export const signJwt = (payload: Record<string, unknown>) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Date.now())
    .setExpirationTime('1w')
    .sign(secret);
};

export const verifyJwt = async (token: string) => {
  const joseSecret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

  const { payload } = await jwtVerify(token, joseSecret);
  return payload;
};
