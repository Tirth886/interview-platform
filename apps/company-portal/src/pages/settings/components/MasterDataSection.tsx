import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@shared/ui";
import { masterDataSections } from "../../../constants/settings";
import type { MasterDataSection as MasterDataSectionId, NamedMasterDataItem } from "../../../types/settings";
import { NamedMasterManager } from "./NamedMasterManager";
import { PayScaleManager } from "./PayScaleManager";
import { StageMasterManager } from "./StageMasterManager";

type MasterDataSectionProps = {
  canEdit: boolean;
  activeMasterSection: MasterDataSectionId;
  setActiveMasterSection?: (section: MasterDataSectionId) => void;
  departments: NamedMasterDataItem[];
  designations: NamedMasterDataItem[];
  branches: NamedMasterDataItem[];
  showSectionNav?: boolean;
};

export const MasterDataSection = ({
  canEdit,
  activeMasterSection,
  setActiveMasterSection,
  departments,
  designations,
  branches,
  showSectionNav = true,
}: MasterDataSectionProps): JSX.Element => (
  <div className="space-y-4">
    {showSectionNav ? (
      <Card>
        <CardHeader>
          <CardTitle>Master Data</CardTitle>
          <CardDescription>
            Navigate and manage reusable entities across hiring workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {masterDataSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveMasterSection?.(section.id)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  activeMasterSection === section.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : null}

    {activeMasterSection === "departments" && (
      <NamedMasterManager
        title="Departments"
        keyName="departments"
        items={departments}
        canEdit={canEdit}
      />
    )}

    {activeMasterSection === "designations" && (
      <NamedMasterManager
        title="Designations"
        keyName="designations"
        items={designations}
        canEdit={canEdit}
      />
    )}

    {activeMasterSection === "branches" && (
      <NamedMasterManager
        title="Branches"
        keyName="branches"
        items={branches}
        canEdit={canEdit}
      />
    )}

    {activeMasterSection === "payScale" && <PayScaleManager canEdit={canEdit} />}
    {activeMasterSection === "stages" && <StageMasterManager canEdit={canEdit} />}
  </div>
);
