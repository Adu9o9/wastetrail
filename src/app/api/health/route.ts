import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true });
}
export const runtime = "nodejs";
