import { NextResponse } from "next/server";
import type { ManualData } from "@/components/component-page/types";
import { catalog, isAvailable } from "@/lib/catalog";
import { componentFiles, type Flavor, hasTailwind } from "@/lib/component-files";
import { highlightLines } from "@/lib/highlight";

// The Manual install's files, loaded when its tab is first opened: static per build.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.filter(isAvailable).map((entry) => ({ component: entry.name }));
}

async function manualFiles(name: string, flavor: Flavor) {
  const files = componentFiles(name, flavor);
  const all = [...files.setup, ...files.files];
  const lines = await Promise.all(all.map((file) => highlightLines(file.path, file.code)));
  return { ...files, lines: Object.fromEntries(all.map((file, i) => [file.path, lines[i] ?? []])) };
}

export async function GET(_request: Request, ctx: RouteContext<"/api/manual/[component]">) {
  const { component } = await ctx.params;
  const entry = catalog.find((e) => e.name === component);
  if (!entry || !isAvailable(entry)) return new NextResponse(null, { status: 404 });
  const data: ManualData = {
    css: await manualFiles(entry.name, "css"),
    ...(hasTailwind(entry.name) ? { tailwind: await manualFiles(entry.name, "tailwind") } : {}),
  };
  return NextResponse.json(data);
}
