import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus, Pencil, Trash2, FolderPlus, Folder, MoreVertical, X, Copy,
  Loader2, Search, ChevronDown, Sparkles, Archive, ArchiveRestore,
  Eye, EyeOff, GitMerge, ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useMyBrands, useBrandGenerationCount } from "@/hooks/queries/useBrands";
import { useMyCampaigns } from "@/hooks/queries/useCampaigns";
import { useMyBrandAssetCounts } from "@/hooks/queries/useBrandAssetCounts";
import {
  useArchiveBrand,
  useUnarchiveBrand,
  useAssignBrandCampaign,
  useDuplicateBrand,
  useMergeBrand,
} from "@/hooks/mutations/useBrandMutations";
import {
  useCreateCampaign,
  useRenameCampaign,
  useDeleteCampaign,
} from "@/hooks/mutations/useCampaignMutations";
import { scoreBrandHealth } from "@/lib/brandHealth";
import type { Brand } from "@/lib/db";

export default function BrandHub() {
  const { user } = useAuth();
  const { log } = useActivityLog();
  const navigate = useNavigate();

  const [newGroupName, setNewGroupName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: "group" } | null>(null);
  const [mergeSource, setMergeSource] = useState<{ id: string; name: string } | null>(null);
  const [mergeDestId, setMergeDestId] = useState<string>("");

  const { data: brands = [], isLoading: brandsLoading } = useMyBrands();
  const { data: groups = [], isLoading: groupsLoading } = useMyCampaigns();
  const { data: assetCounts = {} } = useMyBrandAssetCounts();

  // Merge-dialog: count creatives on the source brand so users see what moves.
  const { data: mergeCreativeCount = null } = useBrandGenerationCount(mergeSource?.id);

  const archiveMutation = useArchiveBrand();
  const unarchiveMutation = useUnarchiveBrand();
  const assignGroupMutation = useAssignBrandCampaign();
  const duplicateMutation = useDuplicateBrand();
  const mergeMutation = useMergeBrand();
  const createCampaignMutation = useCreateCampaign();
  const renameCampaignMutation = useRenameCampaign();
  const deleteCampaignMutation = useDeleteCampaign();

  useEffect(() => {
    if (groups.length > 0 && Object.keys(expandedGroups).length === 0) {
      const initial: Record<string, boolean> = {};
      groups.forEach((g) => { initial[g.id] = true; });
      setExpandedGroups(initial);
    }
  }, [groups, expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleArchive = (id: string, name: string) => {
    archiveMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`"${name}" archived. Generation history is preserved.`);
        log("brand.archived", "brand", id, { name });
      },
      onError: () => toast.error("Failed to archive brand."),
    });
  };

  const handleUnarchive = (id: string, name: string) => {
    unarchiveMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`"${name}" restored.`);
        log("brand.unarchived", "brand", id, { name });
      },
      onError: () => toast.error("Failed to restore brand."),
    });
  };

  const openMergeDialog = (id: string, name: string) => {
    setMergeSource({ id, name });
    setMergeDestId("");
  };

  const handleMerge = () => {
    if (!mergeSource || !mergeDestId || mergeDestId === mergeSource.id) return;
    const destBrand = brands.find((b) => b.id === mergeDestId);
    if (!destBrand) {
      toast.error("Destination brand not found");
      return;
    }
    mergeMutation.mutate(
      { sourceBrandId: mergeSource.id, destinationBrandId: mergeDestId },
      {
        onSuccess: ({ creatives_transferred }) => {
          const transferred = creatives_transferred || (mergeCreativeCount ?? 0);
          log("brand.merged", "brand", mergeSource.id, {
            source_name: mergeSource.name,
            destination_id: mergeDestId,
            destination_name: destBrand.name,
            creatives_transferred: transferred,
          });
          toast.success(
            `Merged "${mergeSource.name}" into "${destBrand.name}". ${transferred} creative${transferred === 1 ? "" : "s"} transferred.`
          );
          setMergeSource(null);
          setMergeDestId("");
        },
        onError: (err: Error) => toast.error(err.message || "Failed to merge brands."),
      },
    );
  };

  const handleDuplicate = (brandId: string) => {
    if (!user) return;
    setDuplicatingId(brandId);
    const original = brands.find((b) => b.id === brandId);
    duplicateMutation.mutate(
      { brandId, userId: user.id },
      {
        onSuccess: (newBrand) => {
          log("brand.duplicated", "brand", newBrand.id, {
            source_brand_id: brandId,
            source_name: original?.name,
          });
          toast.success(`"${original?.name ?? "Brand"}" duplicated successfully.`);
          navigate(`/brands/${newBrand.id}/edit`);
        },
        onError: (err: Error) => toast.error(err.message || "Failed to duplicate brand."),
        onSettled: () => setDuplicatingId(null),
      },
    );
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name || !user) return;
    createCampaignMutation.mutate(
      { name, userId: user.id },
      {
        onSuccess: (data) => {
          toast.success(`Group "${name}" created.`);
          log("group.created", "group", data.id, { name });
          setNewGroupName("");
          setCreateDialogOpen(false);
        },
        onError: () => toast.error("Failed to create group."),
      },
    );
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    deleteCampaignMutation.mutate(groupId, {
      onSuccess: () => {
        toast.success(`Group "${groupName}" deleted.`);
        log("group.deleted", "group", groupId, { name: groupName });
      },
      onError: () => toast.error("Failed to delete group."),
    });
  };

  const handleRenameGroup = () => {
    const name = renameValue.trim();
    if (!renameId || !name) return;
    renameCampaignMutation.mutate(
      { id: renameId, name },
      {
        onSuccess: () => {
          toast.success("Group renamed.");
          log("group.renamed", "group", renameId, { new_name: name });
          setRenameId(null);
          setRenameValue("");
        },
        onError: () => toast.error("Failed to rename group."),
      },
    );
  };

  const handleAssignGroup = (brandId: string, groupId: string | null) => {
    assignGroupMutation.mutate(
      { brandId, campaignId: groupId },
      { onError: () => toast.error("Failed to assign group.") },
    );
  };

  const filteredBrands = useMemo(() => {
    const visible = brands.filter((b) => showArchived ? b.archived : !b.archived);
    if (!searchQuery.trim()) return visible;
    const q = searchQuery.toLowerCase();
    return visible.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, searchQuery, showArchived]);

  const archivedCount = useMemo(
    () => brands.filter((b) => b.archived).length,
    [brands]
  );

  const ungroupedBrands = filteredBrands.filter((b) => !b.campaign_id);
  const groupedBrands = groups.map((g) => ({
    ...g,
    brands: filteredBrands.filter((b) => b.campaign_id === g.id),
  }));

  const isLoading = brandsLoading || groupsLoading;
  const merging = mergeMutation.isPending;

  const BrandCard = ({ brand }: { brand: Brand }) => (
    <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {brand.logo_url ? (
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm">
              <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-sm font-bold">
              {brand.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-semibold text-sm text-foreground truncate">{brand.name}</h3>
              {brand.archived && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground border border-border shrink-0">
                  <Archive className="h-2.5 w-2.5" /> Archived
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="h-3.5 w-3.5 rounded-full border border-border shadow-sm" style={{ backgroundColor: brand.primary_color }} />
              <div className="h-3.5 w-3.5 rounded-full border border-border shadow-sm" style={{ backgroundColor: brand.secondary_color }} />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-1.5 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/brands/${brand.id}/edit`)} className="gap-2">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(brand.id)} disabled={duplicatingId === brand.id} className="gap-2">
                {duplicatingId === brand.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {groups.length > 0 && (
                <>
                  {groups.map((g) => (
                    <DropdownMenuItem key={g.id} onClick={() => handleAssignGroup(brand.id, brand.campaign_id === g.id ? null : g.id)} className="gap-2">
                      <Folder className="h-3.5 w-3.5" />
                      {brand.campaign_id === g.id ? `Remove from "${g.name}"` : `Move to "${g.name}"`}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              {brand.archived ? (
                <DropdownMenuItem onClick={() => handleUnarchive(brand.id, brand.name)} className="gap-2">
                  <ArchiveRestore className="h-3.5 w-3.5" /> Restore brand
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openMergeDialog(brand.id, brand.name)} className="gap-2">
                    <GitMerge className="h-3.5 w-3.5" /> Merge into another brand…
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setArchiveConfirm({ id: brand.id, name: brand.name })} className="text-destructive focus:text-destructive gap-2">
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{brand.brand_voice_rules || "No voice rules set"}</p>

        {(() => {
          const counts = assetCounts[brand.id] || { total: 0, tagged: 0 };
          const h = scoreBrandHealth({
            hasLogo: !!brand.logo_url,
            taggedAssetCount: counts.tagged,
            briefIdentity: brand.brand_brief || "",
            briefVisual: brand.brand_brief || "",
            voiceRules: brand.brand_voice_rules || "",
            visualNevers: brand.negative_prompts || "",
            contentNevers: brand.negative_prompts || "",
            industry: brand.industry || null,
          });
          return (
            <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              h.color === "success" ? "border-success/40 bg-success/10 text-success" :
              h.color === "warning" ? "border-warning/40 bg-warning/10 text-warning" :
              "border-destructive/40 bg-destructive/10 text-destructive"
            }`}>
              <Sparkles className="h-2.5 w-2.5" />
              Health {h.score} · {h.label}
            </div>
          );
        })()}

        <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl text-xs" onClick={() => navigate(`/brands/${brand.id}/edit`)}>
          <Pencil className="h-3 w-3 mr-1.5" /> Edit Brand
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <>
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Brands</h1>
          <p className="text-muted-foreground mt-1">Manage your brand profiles and visual identities.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="pl-8 h-9 w-48 rounded-xl text-sm"
            />
          </div>
          {(showArchived || archivedCount > 0) && (
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived((s) => !s)}
              className="gap-1.5 rounded-xl"
              title={showArchived ? "Show active brands" : "Show archived brands"}
            >
              {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showArchived ? "Active" : `Archived (${archivedCount})`}
            </Button>
          )}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                <FolderPlus className="h-4 w-4" /> New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Brand Group</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Kalrav Projects"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  className="rounded-xl"
                />
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || createCampaignMutation.isPending} className="rounded-xl">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => navigate("/brands/new")} className="gradient-primary hover:gradient-primary-hover text-primary-foreground rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Add Brand
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, gi) => (
            <div key={gi} className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-8 w-full rounded-xl" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {groupedBrands.filter((g) => g.brands.length > 0).map((group) => (
            <Collapsible
              key={group.id}
              open={expandedGroups[group.id] !== false}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedGroups[group.id] !== false ? "" : "-rotate-90"}`} />
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    {renameId === group.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-7 text-sm w-48 rounded-lg"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameGroup();
                            if (e.key === "Escape") setRenameId(null);
                          }}
                        />
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleRenameGroup}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setRenameId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-sm font-semibold text-foreground">{group.name}</h2>
                        <span className="text-xs text-muted-foreground">({group.brands.length})</span>
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                {renameId !== group.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => { setRenameId(group.id); setRenameValue(group.name); }}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteConfirm({ id: group.id, name: group.name, type: "group" })} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <CollapsibleContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.brands.map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {ungroupedBrands.length > 0 && (
            <div className="space-y-3">
              {groupedBrands.some((g) => g.brands.length > 0) && (
                <div className="flex items-center gap-2 px-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground">Ungrouped</h2>
                  <span className="text-xs text-muted-foreground">({ungroupedBrands.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ungroupedBrands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </div>
          )}

          {brands.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                No brands yet. Add your first brand profile to get started.
              </CardContent>
            </Card>
          )}

          {brands.length > 0 && filteredBrands.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                {showArchived
                  ? "No archived brands."
                  : searchQuery.trim()
                  ? `No active brands matching "${searchQuery}".`
                  : "All your brands are archived. Toggle 'Archived' above to view them."}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>

    <AlertDialog open={!!archiveConfirm} onOpenChange={(open) => !open && setArchiveConfirm(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive brand?</AlertDialogTitle>
          <AlertDialogDescription>
            "{archiveConfirm?.name}" will be hidden from your active brand lists, but its
            generation history will be preserved. You can restore it anytime from the
            Archived view.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (archiveConfirm) handleArchive(archiveConfirm.id, archiveConfirm.name);
              setArchiveConfirm(null);
            }}
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Group?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the group "{deleteConfirm?.name}". Brands inside will be ungrouped but not deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (deleteConfirm) handleDeleteGroup(deleteConfirm.id, deleteConfirm.name);
              setDeleteConfirm(null);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog
      open={!!mergeSource}
      onOpenChange={(open) => {
        if (!open && !merging) {
          setMergeSource(null);
          setMergeDestId("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-4 w-4" /> Merge brand
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground truncate">
                {mergeSource?.name}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">choose destination below</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {mergeCreativeCount === null
                ? "Counting creatives…"
                : `${mergeCreativeCount} creative${mergeCreativeCount === 1 ? "" : "s"} will be transferred to the destination brand.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Destination brand
            </label>
            <Select value={mergeDestId} onValueChange={setMergeDestId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a brand to merge into…" />
              </SelectTrigger>
              <SelectContent>
                {brands
                  .filter((b) => b.id !== mergeSource?.id && !b.archived)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                {brands.filter((b) => b.id !== mergeSource?.id && !b.archived).length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No other active brands available.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground space-y-1">
            <p className="font-medium">What happens when you merge:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
              <li>All creatives from "{mergeSource?.name}" move to the destination brand's history.</li>
              <li>The source brand setup (logo, colors, brief, assets) is archived — not deleted — so nothing is lost.</li>
              <li>You can restore the archived brand later from the Archived view.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={merging}
            onClick={() => {
              setMergeSource(null);
              setMergeDestId("");
            }}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl gradient-primary hover:gradient-primary-hover text-primary-foreground"
            disabled={!mergeDestId || merging}
            onClick={handleMerge}
          >
            {merging ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Merging…
              </>
            ) : (
              <>
                <GitMerge className="h-3.5 w-3.5 mr-2" /> Merge & archive source
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
