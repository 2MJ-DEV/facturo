import { Link } from "react-router-dom";
import {
    House, FileText, Users, Wallet,
    ChartPie, BellRing, Settings, EllipsisVertical, ClipboardList
} from "lucide-react";

// Remplacer par le auth système
const role = "comptable";

const menuItems = [
    {
        title: "MAIN MENU",
        items: [
            { icon: House, label: "Dashboard", href: "/", visible: ["admin", "comptable", "employe"] },

            // --- ADMIN ---
            { 
                icon: FileText, 
                label: "Gestion des factures", 
                href: "/invoices", 
                visible: ["admin"] 
            },
            { 
                icon: Users, 
                label: "Gestion des utilisateurs", 
                href: "/users", 
                visible: ["admin"] 
            },
            { 
                icon: Wallet, 
                label: "Gestion des paiements", 
                href: "/payments", 
                visible: ["admin"] 
            },
            { 
                icon: ChartPie, 
                label: "Statistiques", 
                href: "/analytics", 
                visible: ["admin"] 
            },

            // --- COMPTABLE ---
            { 
                icon: FileText, 
                label: "Factures", 
                href: "/invoices", 
                visible: ["comptable"] 
            },
            { 
                icon: Wallet, 
                label: "Paiements", 
                href: "/payments", 
                visible: ["comptable"] 
            },
            { 
                icon: ClipboardList, 
                label: "Rapports financiers", 
                href: "/reports", 
                visible: ["comptable"] 
            },

            // --- EMPLOYE ---
            { 
                icon: FileText, 
                label: "Mes factures", 
                href: "/my-invoices", 
                visible: ["employe"] 
            },
            { 
                icon: Wallet, 
                label: "Mes paiements", 
                href: "/my-payments", 
                visible: ["employe"] 
            },
        ],
    },
    {
        title: "WORKSPACE",
        items: [
            { 
                icon: BellRing, 
                label: "Notifications", 
                href: "/notifications", 
                visible: ["admin", "comptable", "employe"] 
            },
            { 
                icon: Settings, 
                label: "Paramètres", 
                href: "/settings", 
                visible: ["admin", "comptable", "employe"] 
            },
        ],
    },
];

const Menu = () => {
    return (
        <div className="mt-4 text-sm flex flex-col justify-between h-full">
            <div>
                {menuItems.map((section) => (
                    <div className="mt-5" key={section.title}>
                        <span className="text-zinc-400 text-xs font-semibold tracking-wide">
                            {section.title}
                        </span>
                        <div className="mt-2">
                            {section.items.map((item) => {
                                if (!item.visible.includes(role)) return null;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        to={item.href}
                                        key={item.label}
                                        className="flex items-center justify-between gap-3 py-2 px-2 text-[15px] font-medium hover:bg-zinc-950/5 rounded-md text-zinc-600"
                                    >
                                        <div className="flex items-center gap-3">
                                            {Icon && <Icon className="w-5 h-5" />}
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer utilisateur */}
            <div className="mt-6 w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 transition cursor-pointer">
                <img
                    src="/favicon.ico"
                    alt="User avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                />

                <div className="flex flex-col flex-1">
                    <span></span>
                    <span></span>
                </div>

                <EllipsisVertical className="w-4 h-4 text-zinc-500" />
            </div>
        </div>
    );
};

export default Menu;