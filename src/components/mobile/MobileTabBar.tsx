"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, FileText, MessageSquare, User } from "lucide-react";

const items = [
	{ href: "/portal", label: "Home", icon: Home },
	{ href: "/portal/appointments", label: "Appointments", icon: Calendar },
	{ href: "/portal/records", label: "Records", icon: FileText },
	{ href: "/portal/messages", label: "Messages", icon: MessageSquare },
	{ href: "/patient/profile", label: "Profile", icon: User },
];

export default function MobileTabBar() {
	const pathname = usePathname();
	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
			<ul className="grid grid-cols-5">
				{items.map(({ href, label, icon: Icon }) => {
					const active = pathname.startsWith(href);
					return (
						<li key={href}>
							<Link
								href={href}
								className={`flex flex-col items-center justify-center h-16 gap-1 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
								aria-label={label}
							>
								<Icon className="h-5 w-5" />
								<span>{label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}


