import { makeRouteHandler } from "@keystatic/next/route-handler";
import { cmsEnabled } from "@/lib/cms";
import config from "../../../../../keystatic.config";

const handler = makeRouteHandler({ config });
const off = () => new Response("Not found", { status: 404 });

export const GET = cmsEnabled ? handler.GET : off;
export const POST = cmsEnabled ? handler.POST : off;
