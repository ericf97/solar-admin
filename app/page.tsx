import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalsWidget } from "@/components/widgets/portals-widget";
import { MonstersWidget } from "@/components/widgets/monsters-widget";
import { SkillsWidget } from "@/components/widgets/skills-widget";
import { SettingsWidget } from "@/components/widgets/settings-widget";
import { cookies } from "@/node_modules/next/headers";
import { unauthorized } from "@/node_modules/next/navigation";

export default function DashboardPage() {
  const token = cookies().get('access_token')?.value

  if (!token) {
    unauthorized() // returns 401 with minimal response
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold mb-8 text-gray-800 dark:text-white">
            Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-2xl">Portals</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <PortalsWidget />
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-xl">Monsters</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <MonstersWidget />
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-xl">Skills</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SkillsWidget />
              </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-2xl">Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SettingsWidget />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

