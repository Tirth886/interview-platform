import type { Dispatch, SetStateAction } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import { timezoneOptions } from "../../../constants/settings";
import type { GeneralSettings } from "../../../types/settings";

type GeneralSettingsSectionProps = {
  canEdit: boolean;
  generalForm: GeneralSettings;
  setGeneralForm: Dispatch<SetStateAction<GeneralSettings>>;
  onSave: () => void;
};

export const GeneralSettingsSection = ({
  canEdit,
  generalForm,
  setGeneralForm,
  onSave,
}: GeneralSettingsSectionProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle>General Settings</CardTitle>
      <CardDescription>
        Update company profile and default interview preferences.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Company Name</label>
          <Input
            value={generalForm.companyName}
            onChange={(event) =>
              setGeneralForm((prev) => ({ ...prev, companyName: event.target.value }))
            }
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Company Logo URL</label>
          <Input
            value={generalForm.logoUrl}
            onChange={(event) =>
              setGeneralForm((prev) => ({ ...prev, logoUrl: event.target.value }))
            }
            placeholder="https://example.com/logo.png"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Timezone</label>
          <Select
            value={generalForm.timezone}
            onValueChange={(value) =>
              setGeneralForm((prev) => ({ ...prev, timezone: value }))
            }
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  {timezone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Default Interview Duration (mins)</label>
          <Input
            type="number"
            min={15}
            step={15}
            value={generalForm.defaultInterviewDurationMinutes}
            onChange={(event) =>
              setGeneralForm((prev) => ({
                ...prev,
                defaultInterviewDurationMinutes: Number(event.target.value) || 45,
              }))
            }
            disabled={!canEdit}
          />
        </div>
      </div>

      <Button disabled={!canEdit} onClick={onSave}>
        Save General Settings
      </Button>
    </CardContent>
  </Card>
);
