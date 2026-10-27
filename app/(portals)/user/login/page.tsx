import type { Metadata } from "next";
import PortalAuth from "../../portal-auth";

export const metadata: Metadata = { title: "User login · PocketSeculex" };
export default function Page() { return <PortalAuth portal="user" mode="login" />; }
