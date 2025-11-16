import { useState, useEffect } from "react";
import {
  useToppingGroups,
  useCreateToppingGroup,
  useUpdateToppingGroup,
  useDeleteToppingGroup,
} from "@/hooks/use-topping-groups";
import { useSupabaseToppings } from "@/hooks/use-supabase-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { Plus, Edit, Trash2, Save, X, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface ToppingGroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToppingGroupManagementModal({ isOpen, onClose }: ToppingGroupManagementModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: toppingGroups, refetch } = useToppingGroups();
  const { data: allToppings } = useSupabaseToppings();
  const createGroup = useCreateToppingGroup();
  const updateGroup = useUpdateToppingGroup();
  const deleteGroup = useDeleteToppingGroup();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    isRequired: false,
    maxSelections: 1,
    minSelections: 0,
    displayOrder: 0,
  });

  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);

  const resetForm = () => {
    setFormData({
      name: "",
      nameEn: "",
      isRequired: false,
      maxSelections: 1,
      minSelections: 0,
      displayOrder: 0,
    });
    setSelectedToppingIds([]);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (group: any) => {
    setFormData({
      name: group.name,
      nameEn: group.nameEn || group.name_en,
      isRequired: group.isRequired || group.is_required || false,
      maxSelections: group.maxSelections || group.max_selections || 1,
      minSelections: group.minSelections || group.min_selections || 0,
      displayOrder: group.displayOrder || group.display_order || 0,
    });

    // Extract topping IDs from the group
    const toppingIds = group.toppingGroupItems?.map((item: any) => item.toppingId || item.topping_id) || [];
    setSelectedToppingIds(toppingIds);

    setEditingId(group.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.nameEn.trim()) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Täytä kaikki pakolliset kentät", "Please fill all required fields"),
        variant: "destructive",
      });
      return;
    }

    try {
      const groupData = {
        name: formData.name,
        name_en: formData.nameEn,
        is_required: formData.isRequired,
        max_selections: formData.maxSelections,
        min_selections: formData.minSelections,
        display_order: formData.displayOrder,
      };

      let groupId: number;

      if (editingId) {
        // Update existing group
        const result = await updateGroup.mutateAsync({
          id: editingId,
          data: groupData,
        });
        groupId = editingId;

        toast({
          title: t("Onnistui", "Success"),
          description: t("Täydennysryhmä päivitetty", "Topping group updated"),
        });
      } else {
        // Create new group
        const result = await createGroup.mutateAsync(groupData);
        groupId = result.id;

        toast({
          title: t("Onnistui", "Success"),
          description: t("Täydennysryhmä luotu", "Topping group created"),
        });
      }

      // Update topping group items
      await updateToppingGroupItems(groupId, selectedToppingIds);

      resetForm();
      refetch();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: t("Virhe", "Error"),
        description: error instanceof Error ? error.message : t("Toiminto epäonnistui", "Operation failed"),
        variant: "destructive",
      });
    }
  };

  const updateToppingGroupItems = async (groupId: number, toppingIds: number[]) => {
    // Delete existing items
    await supabase
      .from('topping_group_items')
      .delete()
      .eq('topping_group_id', groupId);

    // Insert new items
    if (toppingIds.length > 0) {
      const items = toppingIds.map((toppingId, index) => ({
        topping_group_id: groupId,
        topping_id: toppingId,
        display_order: index,
      }));

      const { error } = await supabase
        .from('topping_group_items')
        .insert(items);

      if (error) {
        throw error;
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("Haluatko varmasti poistaa tämän täydennysryhmän?", "Are you sure you want to delete this topping group?"))) {
      return;
    }

    try {
      await deleteGroup.mutateAsync(id);
      toast({
        title: t("Onnistui", "Success"),
        description: t("Täydennysryhmä poistettu", "Topping group deleted"),
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t("Virhe", "Error"),
        description: error instanceof Error ? error.message : t("Poisto epäonnistui", "Delete failed"),
        variant: "destructive",
      });
    }
  };

  const toggleToppingSelection = (toppingId: number) => {
    setSelectedToppingIds(prev =>
      prev.includes(toppingId)
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const toggleGroupExpansion = (groupId: number) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t("Täydennysryhmien hallinta", "Topping Group Management")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>
                  {editingId
                    ? t("Muokkaa täydennysryhmää", "Edit Topping Group")
                    : t("Lisää uusi täydennysryhmä", "Add New Topping Group")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t("Nimi (FI)", "Name (FI)")}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t("Esim. Pizzan täytteet", "E.g. Pizza Toppings")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameEn">{t("Nimi (EN)", "Name (EN)")}</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="E.g. Pizza Toppings"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="minSelections">{t("Minimi valinta", "Min Selections")}</Label>
                    <Input
                      id="minSelections"
                      type="number"
                      min="0"
                      value={formData.minSelections}
                      onChange={(e) => setFormData({ ...formData, minSelections: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxSelections">{t("Maksimi valinta", "Max Selections")}</Label>
                    <Input
                      id="maxSelections"
                      type="number"
                      min="1"
                      value={formData.maxSelections}
                      onChange={(e) => setFormData({ ...formData, maxSelections: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayOrder">{t("Järjestys", "Display Order")}</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                  <Label htmlFor="isRequired">{t("Pakollinen valinta", "Required Selection")}</Label>
                </div>

                {/* Topping Selection */}
                <div>
                  <Label className="text-lg font-semibold mb-2 block">
                    {t("Valitse täytteet ryhmään", "Select Toppings for Group")}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {allToppings?.map((topping: any) => (
                      <div
                        key={topping.id}
                        onClick={() => toggleToppingSelection(topping.id)}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                          selectedToppingIds.includes(topping.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{topping.name}</div>
                        <div className="text-sm text-gray-500">{topping.nameEn || topping.name_en}</div>
                        <div className="text-xs text-gray-400">€{topping.price}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("Valittu", "Selected")}: {selectedToppingIds.length}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {t("Tallenna", "Save")}
                  </Button>
                  <Button onClick={resetForm} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    {t("Peruuta", "Cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Button */}
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {t("Lisää uusi täydennysryhmä", "Add New Topping Group")}
            </Button>
          )}

          {/* Existing Groups List */}
          <div className="space-y-3">
            {toppingGroups?.map((group: any) => (
              <Card key={group.id} className={editingId === group.id ? "ring-2 ring-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        {group.name}
                        {group.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            {t("Pakollinen", "Required")}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{group.name_en}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-600">
                        <span>{t("Min", "Min")}: {group.min_selections}</span>
                        <span>{t("Max", "Max")}: {group.max_selections}</span>
                        <span>{t("Järjestys", "Order")}: {group.display_order}</span>
                        <span>
                          {t("Täytteitä", "Toppings")}: {group.toppingGroupItems?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleGroupExpansion(group.id)}
                      >
                        {expandedGroupId === group.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(group)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(group.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Toppings List */}
                  {expandedGroupId === group.id && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-semibold mb-2">
                        {t("Täytteet tässä ryhmässä:", "Toppings in this group:")}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {group.toppingGroupItems?.map((item: any) => (
                          <div key={item.id} className="p-2 bg-gray-50 rounded border text-sm">
                            <div className="font-medium">{item.toppings?.name}</div>
                            <div className="text-xs text-gray-500">€{item.toppings?.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {toppingGroups?.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <p>{t("Ei vielä täydennysryhmiä.", "No topping groups yet.")}</p>
                  <p className="text-sm mt-1">
                    {t("Klikkaa 'Lisää uusi' aloittaaksesi.", "Click 'Add New' to get started.")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
