import type { Metadata } from "next";
import PortalAuth from "../../portal-auth";

export const metadata: Metadata = { title: "LGU login · PocketSeculex" };
export default function Page() { return <PortalAuth portal="lgu" mode="login" />; }
