import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@shared/ui";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import type { NamedMasterDataItem, NamedMasterKey } from "../../../types/settings";

export const NamedMasterManager = ({
  title,
  keyName,
  items,
  canEdit,
}: {
  title: string;
  keyName: NamedMasterKey;
  items: NamedMasterDataItem[];
  canEdit: boolean;
}): JSX.Element => {
  const addNamedMasterItem = useSettingsStore((state) => state.addNamedMasterItem);
  const updateNamedMasterItem = useSettingsStore((state) => state.updateNamedMasterItem);
  const deleteNamedMasterItem = useSettingsStore((state) => state.deleteNamedMasterItem);

  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Manage reusable {title.toLowerCase()} used across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder={`Add ${title.toLowerCase()} item`}
            disabled={!canEdit}
          />
          <Button
            disabled={!canEdit || !newValue.trim()}
            onClick={() => {
              addNamedMasterItem(keyName, newValue);
              setNewValue("");
            }}
          >
            Add
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No entries yet.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center"
                >
                  {isEditing ? (
                    <Input
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      className="sm:flex-1"
                      disabled={!canEdit}
                    />
                  ) : (
                    <p className="sm:flex-1 text-sm font-medium text-foreground">{item.name}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          disabled={!canEdit || !editingValue.trim()}
                          onClick={() => {
                            updateNamedMasterItem(keyName, item.id, editingValue);
                            setEditingId(null);
                            setEditingValue("");
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingValue("");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit}
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingValue(item.name);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!canEdit}
                          onClick={() => deleteNamedMasterItem(keyName, item.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
