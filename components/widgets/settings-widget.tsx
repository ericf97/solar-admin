import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Swords, Shield, ChevronRight, MapPin } from "lucide-react";

const settingsCategories = [
  {
    name: "Portals",
    icon: MapPin,
    subtitle: "Portal settings",
    preview: [
      "Check-in rewards: Energy 200, Sap 200, Exp 200",
      "Check-in interval: 60 minutes",
    ],
    href: "/settings#portals",
  },
  {
    name: "Rifts",
    icon: Zap,
    subtitle: "Rift configuration",
    preview: [
      "Max rift count: 5",
      "Spawn radius: 100m",
      "Min distance to generate: 10m",
    ],
    href: "/settings#rifts",
  },
  {
    name: "Skills",
    icon: Swords,
    subtitle: "Skill parameters",
    preview: [
      "Base energy: 282, Base sap: 688",
      "Costs: Basic 0.15, Long press 0.35, Ultimate 0.5",
      "Growth rate: Energy 1.055, Sap 1.055",
    ],
    href: "/settings#skills",
  },
  {
    name: "Validations",
    icon: Shield,
    subtitle: "Game validations",
    preview: ["Max allowed movement speed: 100"],
    href: "/settings#validations",
  },
];

export function SettingsWidget() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {settingsCategories.map(category => (
        <Link href={category.href} key={category.name} className="block">
          <Card className="h-full transition-all hover:shadow-md cursor-pointer border border-white dark:border-border hover:border-gray-300 dark:hover:border-gray-600">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-lg shrink-0">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {category.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                  <div className="space-y-1">
                    {category.preview.map((line, index) => (
                      <p
                        key={index}
                        className="text-xs text-muted-foreground line-clamp-1"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
