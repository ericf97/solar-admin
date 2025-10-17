import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalsWidget } from "@/components/widgets/portals-widget";
import { MonstersWidget } from "@/components/widgets/monsters-widget";
import { SkillsWidget } from "@/components/widgets/skills-widget";
import { SettingsWidget } from "@/components/widgets/settings-widget";
import { MapPin, Skull, Zap, Settings } from "lucide-react";

export default async function DashboardPage() {
  return (
    <Layout>
      <h1 className="text-4xl font-extrabold mb-8">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2 border border-white dark:border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-fit">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Portals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <PortalsWidget />
          </CardContent>
        </Card>
        <Card className="border border-white dark:border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-fit">
          <CardHeader className="border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Skull className="h-5 w-5 text-primary" />
              Monsters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <MonstersWidget />
          </CardContent>
        </Card>
        <Card className="border border-white dark:border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-fit">
          <CardHeader className="border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SkillsWidget />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 border border-white dark:border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-fit">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SettingsWidget />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
