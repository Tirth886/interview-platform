import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@shared/ui";
import { settingsTabs } from "../../../constants/settings";
import type { SettingsTab } from "../../../types/settings";

type SettingsNavProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

export const SettingsNav = ({ activeTab, onTabChange }: SettingsNavProps): JSX.Element => (
  <Card className="lg:sticky lg:top-4">
    <CardHeader className="pb-3">
      <CardTitle className="text-base">Settings Menu</CardTitle>
      <CardDescription>Switch sections from here.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      {settingsTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-left transition-colors",
            activeTab === tab.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <p className="text-sm font-semibold">{tab.label}</p>
          <p className="mt-0.5 text-xs">{tab.description}</p>
        </button>
      ))}
    </CardContent>
  </Card>
);
