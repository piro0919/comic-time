/* eslint-disable import/prefer-default-export */
import { type NextRequest, NextResponse } from "next/server";
import { addLocalOpen, isLocal } from "@/app/localOpens";

/**
 * 手元で動かしているときだけ、押された作品を控える。
 * Vercel Web Analytics は開発中のイベントを受け取らないため、
 * ランキングが動くところを見るにはこちらで数える必要がある。
 *
 * 本番では何もせず 404 を返す。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isLocal) {
    return new NextResponse(null, { status: 404 });
  }

  const { title } = (await request.json()) as { title?: unknown };

  if (typeof title !== "string" || title === "") {
    return NextResponse.json({ error: "title が要ります" }, { status: 400 });
  }

  addLocalOpen(title);

  return NextResponse.json({ ok: true });
}
