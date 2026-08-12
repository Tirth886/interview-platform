import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui";
import type { PayScaleForm, PayScaleRule } from "../../../types/settings";
import { blankPayScaleForm } from "../../../constants/settings";
import { useSettingsStore } from "../../../stores/useSettingsStore";

export const PayScaleManager = ({ canEdit }: { canEdit: boolean }): JSX.Element => {
  const payScales = useSettingsStore((state) => state.masterData.payScales);
  const addPayScale = useSettingsStore((state) => state.addPayScale);
  const updatePayScale = useSettingsStore((state) => state.updatePayScale);
  const deletePayScale = useSettingsStore((state) => state.deletePayScale);

  const [newPayScale, setNewPayScale] = useState<PayScaleForm>(blankPayScaleForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<PayScaleForm>(blankPayScaleForm);

  const startEdit = (rule: PayScaleRule): void => {
    setEditingId(rule.id);
    setEditingForm({
      minExperienceYears: String(rule.minExperienceYears),
      maxExperienceYears: String(rule.maxExperienceYears),
      minSalary: String(rule.minSalary),
      maxSalary: String(rule.maxSalary),
      currency: rule.currency,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PayScale Rules</CardTitle>
        <CardDescription>Map experience range to salary bands.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-5">
          <Input
            type="number"
            min={0}
            placeholder="Min exp"
            value={newPayScale.minExperienceYears}
            onChange={(event) =>
              setNewPayScale((prev) => ({ ...prev, minExperienceYears: event.target.value }))
            }
            disabled={!canEdit}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max exp"
            value={newPayScale.maxExperienceYears}
            onChange={(event) =>
              setNewPayScale((prev) => ({ ...prev, maxExperienceYears: event.target.value }))
            }
            disabled={!canEdit}
          />
          <Input
            type="number"
            min={0}
            placeholder="Min salary"
            value={newPayScale.minSalary}
            onChange={(event) =>
              setNewPayScale((prev) => ({ ...prev, minSalary: event.target.value }))
            }
            disabled={!canEdit}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max salary"
            value={newPayScale.maxSalary}
            onChange={(event) =>
              setNewPayScale((prev) => ({ ...prev, maxSalary: event.target.value }))
            }
            disabled={!canEdit}
          />
          <div className="flex gap-2">
            <Select
              value={newPayScale.currency}
              onValueChange={(value: "USD" | "INR") =>
                setNewPayScale((prev) => ({ ...prev, currency: value }))
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={!canEdit}
              onClick={() =>
                addPayScale({
                  minExperienceYears: Number(newPayScale.minExperienceYears) || 0,
                  maxExperienceYears: Number(newPayScale.maxExperienceYears) || 0,
                  minSalary: Number(newPayScale.minSalary) || 0,
                  maxSalary: Number(newPayScale.maxSalary) || 0,
                  currency: newPayScale.currency,
                })
              }
            >
              Add
            </Button>
          </div>
        </div>

        {payScales.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No payscale rules yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Experience</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="w-[220px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payScales.map((rule) => {
                const isEditing = editingId === rule.id;
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      {isEditing
                        ? `${editingForm.minExperienceYears} - ${editingForm.maxExperienceYears} yrs`
                        : `${rule.minExperienceYears} - ${rule.maxExperienceYears} yrs`}
                    </TableCell>
                    <TableCell>
                      {isEditing
                        ? `${editingForm.minSalary} - ${editingForm.maxSalary}`
                        : `${rule.minSalary.toLocaleString()} - ${rule.maxSalary.toLocaleString()}`}
                    </TableCell>
                    <TableCell>{isEditing ? editingForm.currency : rule.currency}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => {
                              updatePayScale(rule.id, {
                                minExperienceYears: Number(editingForm.minExperienceYears) || 0,
                                maxExperienceYears: Number(editingForm.maxExperienceYears) || 0,
                                minSalary: Number(editingForm.minSalary) || 0,
                                maxSalary: Number(editingForm.maxSalary) || 0,
                                currency: editingForm.currency,
                              });
                              setEditingId(null);
                            }}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" disabled={!canEdit} onClick={() => startEdit(rule)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canEdit}
                            onClick={() => deletePayScale(rule.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
