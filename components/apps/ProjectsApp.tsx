'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  RiAddLine,
  RiCalendarLine,
  RiFolderLine,
  RiListCheck,
  RiLayoutGridLine,
  RiFileCopyLine,
  RiDragDropLine,
  RiCheckboxCircleLine,
  RiDeleteBin6Line,
  RiCloseLine,
} from 'react-icons/ri';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjectFormModal } from './projects/ProjectFormModal';
import { ProjectDeleteDialog } from './projects/ProjectDeleteDialog';
import { ProjectActionsMenu } from './projects/ProjectActionsMenu';
import { ProjectStatusMenu } from './projects/ProjectStatusMenu';
import type { Project, ProjectStatus } from '@/types/project';
import { useTranslation } from '@/lib/hooks/useTranslation';

type ViewMode = 'card' | 'list';

export function ProjectsApp() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20; // 1回の読み込み件数

  // モーダル・ダイアログの状態管理
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // 選択モード関連の状態管理
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // プロジェクト一覧取得（初回）
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setOffset(0);

      const response = await fetch(`/api/projects?limit=${LIMIT}&offset=0`);

      if (!response.ok) {
        throw new Error(t.projects.fetchError);
      }

      const result = await response.json();
      const data = result.data || [];
      setProjects(data);
      setHasMore(data.length === LIMIT);
      setOffset(LIMIT);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : t.projects.error);
    } finally {
      setIsLoading(false);
    }
  };

  // 追加プロジェクト読み込み（無限スクロール用）
  const loadMoreProjects = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);

      const response = await fetch(`/api/projects?limit=${LIMIT}&offset=${offset}`);

      if (!response.ok) {
        throw new Error(t.projects.fetchError);
      }

      const result = await response.json();
      const newData = result.data || [];

      setProjects((prev) => [...prev, ...newData]);
      setHasMore(newData.length === LIMIT);
      setOffset((prev) => prev + LIMIT);
    } catch (err) {
      console.error('Error loading more projects:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 無限スクロール用のIntersection Observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreProjects();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, offset]);

  // プロジェクト作成ハンドラー
  const handleCreate = async (formData: any) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
        status: formData.status,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.projects.createError);
    }

    await fetchProjects();
  };

  // プロジェクト更新ハンドラー
  const handleUpdate = async (formData: any) => {
    if (!selectedProject) return;

    const response = await fetch(`/api/projects/${selectedProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
        status: formData.status,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.projects.updateError);
    }

    await fetchProjects();
    setSelectedProject(null);
  };

  // プロジェクト削除ハンドラー
  const handleDelete = async () => {
    if (!selectedProject) return;

    const response = await fetch(`/api/projects/${selectedProject.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.projects.deleteError);
    }

    await fetchProjects();
    setSelectedProject(null);
  };

  // プロジェクト複製ハンドラー
  const handleDuplicate = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(t.projects.duplicateError);
      }

      // 一覧を再取得
      await fetchProjects();
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert(err instanceof Error ? err.message : t.projects.error);
    }
  };

  // 編集モーダルを開く
  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  // 削除ダイアログを開く
  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  // 選択モード切り替え
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    // 選択モード終了時は選択をクリア
    if (isSelectionMode) {
      setSelectedProjectIds([]);
    }
  };

  // プロジェクト選択/解除の切り替え
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  // 全選択
  const selectAllProjects = () => {
    setSelectedProjectIds(projects.map((p) => p.id));
  };

  // 選択解除
  const clearSelection = () => {
    setSelectedProjectIds([]);
  };

  // 一括削除ハンドラー
  const handleBulkDelete = async () => {
    if (selectedProjectIds.length === 0) return;

    const confirmMessage = t.projects.bulkDeleteConfirm.replace('{count}', String(selectedProjectIds.length));
    if (!confirm(confirmMessage)) return;

    try {
      // 各プロジェクトを削除（並列実行）
      const deletePromises = selectedProjectIds.map((id) =>
        fetch(`/api/projects/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);

      // エラーチェック
      const errors = results.filter((res) => !res.ok);
      if (errors.length > 0) {
        throw new Error(t.projects.bulkDeleteError.replace('{count}', String(errors.length)));
      }

      // 成功したら一覧を再取得
      await fetchProjects();
      setSelectedProjectIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Error bulk deleting projects:', err);
      alert(err instanceof Error ? err.message : t.projects.error);
    }
  };

  // ステータス変更ハンドラー
  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t.projects.statusUpdateError);
      }

      await fetchProjects();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err instanceof Error ? err.message : t.projects.error);
    }
  };

  // ドラッグ終了時のハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return; // ドロップ位置が無効、または同じ位置の場合は何もしない
    }

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 楽観的UI更新（即座にUIを更新）
    const newProjects = arrayMove(projects, oldIndex, newIndex);
    setProjects(newProjects);

    // 並び順をサーバーに保存
    try {
      const projectIds = newProjects.map((p) => p.id);

      const response = await fetch('/api/projects/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds }),
      });

      if (!response.ok) {
        throw new Error(t.projects.reorderError);
      }
    } catch (err) {
      console.error('Error reordering projects:', err);
      alert(err instanceof Error ? err.message : t.projects.error);
      // エラー時は元の順序に戻す
      await fetchProjects();
    }
  };

  const overdueIds = useMemo(() => {
    const today = new Date();
    return projects
      .filter((p) => p.end_date && new Date(p.end_date) < today && p.status !== 'completed')
      .map((p) => p.id);
  }, [projects]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 h-full overflow-auto bg-mist text-ink flex items-center justify-center">
        <div className="text-cloud">{t.projects.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 h-full overflow-auto bg-mist text-ink flex items-center justify-center">
        <div className="text-accent-sand">{error}</div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-6 h-full overflow-auto bg-mist text-ink space-y-4 md:space-y-6">
        <Header
          viewMode={viewMode}
          onChangeView={setViewMode}
          onCreateClick={() => setIsCreateModalOpen(true)}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          selectedCount={selectedProjectIds.length}
          totalCount={projects.length}
          onSelectAll={selectAllProjects}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
        />

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-cloud">
            <RiFolderLine className="w-16 h-16 mb-4" />
            <p className="text-lg">{t.projects.noProjects}</p>
            <p className="text-sm">{t.projects.noProjectsHint}</p>
          </div>
        ) : (
          <>
            <SortableContext items={projects.map((p) => p.id)} strategy={viewMode === 'card' ? rectSortingStrategy : verticalListSortingStrategy}>
              {viewMode === 'card' ? (
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      overdue={overdueIds.includes(project.id)}
                      onDuplicate={handleDuplicate}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onStatusChange={handleStatusChange}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedProjectIds.includes(project.id)}
                      onToggleSelect={toggleProjectSelection}
                    />
                  ))}
                </div>
              ) : (
                <ProjectList
                  projects={projects}
                  overdueIds={overdueIds}
                  onDuplicate={handleDuplicate}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onStatusChange={handleStatusChange}
                  isSelectionMode={isSelectionMode}
                  selectedProjectIds={selectedProjectIds}
                  onToggleSelect={toggleProjectSelection}
                />
              )}
            </SortableContext>

            {/* 無限スクロール用のトリガー要素 */}
            <div ref={observerTarget} className="h-4" />

            {/* ローディングインジケーター */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-8">
                <div className="text-cloud text-sm">{t.projects.loadingMore}</div>
              </div>
            )}

            {/* すべて読み込み完了 */}
            {!hasMore && projects.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <div className="text-cloud text-xs">{t.projects.allLoaded}</div>
              </div>
            )}
          </>
        )}

      {/* 新規作成モーダル */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 編集モーダル */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleUpdate}
        initialData={
          selectedProject
            ? {
                name: selectedProject.name,
                description: selectedProject.description || '',
                start_date: selectedProject.start_date,
                end_date: selectedProject.end_date || '',
                notes: selectedProject.notes || '',
                status: selectedProject.status,
              }
            : undefined
        }
        mode="edit"
      />

      {/* 削除確認ダイアログ */}
      <ProjectDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDelete}
        projectName={selectedProject?.name || ''}
      />
      </div>
    </DndContext>
  );
}

function Header({
  viewMode,
  onChangeView,
  onCreateClick,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
}: {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  onCreateClick: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-1">{t.projects.title}</h2>
        {isSelectionMode && (
          <p className="text-sm text-cloud">
            {t.projects.selectedCount.replace('{count}', String(selectedCount)).replace('{total}', String(totalCount))}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {!isSelectionMode ? (
          <>
            <ViewToggle viewMode={viewMode} onChangeView={onChangeView} />
            <button
              onClick={onToggleSelectionMode}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors"
              aria-label={t.projects.selectionMode}
            >
              <RiCheckboxCircleLine className="w-4 h-4" /> {t.projects.select}
            </button>
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors"
            >
              <RiAddLine className="w-4 h-4" /> {t.projects.new}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSelectAll}
              className="px-4 py-2 bg-surface border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors text-sm"
              disabled={selectedCount === totalCount}
            >
              {t.projects.selectAll}
            </button>
            <button
              onClick={onClearSelection}
              className="px-4 py-2 bg-surface border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors text-sm"
              disabled={selectedCount === 0}
            >
              {t.projects.clearSelection}
            </button>
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedCount === 0}
            >
              <RiDeleteBin6Line className="w-4 h-4" /> {t.projects.deleteWithCount.replace('{count}', String(selectedCount))}
            </button>
            <button
              onClick={onToggleSelectionMode}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors"
              aria-label={t.projects.selectionModeEnd}
            >
              <RiCloseLine className="w-4 h-4" /> {t.common.cancel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ViewToggle({ viewMode, onChangeView }: { viewMode: ViewMode; onChangeView: (mode: ViewMode) => void }) {
  const { t } = useTranslation();
  const items: { mode: ViewMode; icon: React.ReactNode }[] = [
    { mode: 'card', icon: <RiLayoutGridLine className="w-4 h-4" /> },
    { mode: 'list', icon: <RiListCheck className="w-4 h-4" /> },
  ];
  return (
    <div className="flex rounded-full border border-cloud/40 overflow-hidden">
      {items.map(({ mode, icon }) => (
        <button
          key={mode}
          onClick={() => onChangeView(mode)}
          className={`px-3 py-2 flex items-center justify-center ${
            viewMode === mode ? 'bg-ink text-white' : 'text-ink'
          }`}
          aria-label={mode === 'card' ? t.projects.cardView : t.projects.listView}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  overdue,
  onDuplicate,
  onEdit,
  onDelete,
  onStatusChange,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}: {
  project: Project;
  overdue: boolean;
  onDuplicate: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  // ドラッグ&ドロップ機能のためのフック
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  // ドラッグ中のスタイル設定
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface border rounded-3xl p-5 shadow-soft flex flex-col gap-4 ${
        isSelected ? 'border-accent-sand border-2' : 'border-white/40'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {/* 選択モード時はチェックボックス、通常時はドラッグハンドル */}
            {isSelectionMode ? (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(project.id)}
                className="w-5 h-5 rounded border-cloud/30 text-accent-sand focus:ring-accent-sand cursor-pointer"
                aria-label={t.projects.selectProject}
              />
            ) : (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-cloud/20 transition-colors"
                aria-label={t.projects.sortProject}
              >
                <RiDragDropLine className="w-5 h-5 text-cloud" />
              </button>
            )}
            <RiFolderLine className="w-5 h-5 text-cloud" />
            <ProjectStatusMenu
              currentStatus={project.status}
              onChange={(newStatus) => onStatusChange(project.id, newStatus)}
            />
          </div>
          <h3 className="text-lg font-semibold mt-1">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-cloud line-clamp-2 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onDuplicate(project.id)}
            className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
            title={t.projects.duplicate}
            aria-label={t.projects.duplicateProject}
          >
            <RiFileCopyLine className="w-5 h-5" />
          </button>
          <ProjectActionsMenu onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
        </div>
      </div>

      <div className="text-sm text-cloud space-y-2">
        <p className="flex items-center gap-2">
          <RiCalendarLine className="w-4 h-4" />
          <span>
            {project.start_date}
            {project.end_date && ` - ${project.end_date}`}
          </span>
        </p>
        <p className={`text-xs ${overdue ? 'text-accent-sand' : 'text-cloud'}`}>
          {overdue ? t.projects.overdue : t.projects.onTime}
        </p>
        {project.notes && <p className="text-xs">{t.projects.notes} {project.notes}</p>}
      </div>
    </div>
  );
}

// リスト行コンポーネント（ドラッグ&ドロップ対応）
function ProjectListRow({
  project,
  isLast,
  overdue,
  onDuplicate,
  onEdit,
  onDelete,
  onStatusChange,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}: {
  project: Project;
  isLast: boolean;
  overdue: boolean;
  onDuplicate: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  // ドラッグ&ドロップ機能のためのフック
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  // ドラッグ中のスタイル設定
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid md:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] grid-cols-[auto_1fr_auto] gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 text-sm items-center ${
        !isLast ? 'border-b border-cloud/10' : ''
      } ${isSelected ? 'bg-accent-sand/10' : ''}`}
    >
      {/* 選択モード時はチェックボックス、通常時はドラッグハンドル */}
      {isSelectionMode ? (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(project.id)}
          className="w-4 h-4 rounded border-cloud/30 text-accent-sand focus:ring-accent-sand cursor-pointer"
          aria-label={t.projects.selectProject}
        />
      ) : (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-cloud/20 transition-colors"
          aria-label={t.projects.sortProject}
        >
          <RiDragDropLine className="w-4 h-4 text-cloud" />
        </button>
      )}

      <div className="font-medium truncate">{project.name}</div>
      <div className="hidden md:block text-cloud text-xs truncate">{project.description || '—'}</div>
      <div className="hidden md:block text-cloud text-xs">
        {project.start_date}
        {project.end_date && ` - ${project.end_date}`}
        {overdue && <span className="ml-2 text-accent-sand">⚠️</span>}
      </div>
      <div className="hidden md:block">
        <ProjectStatusMenu
          currentStatus={project.status}
          onChange={(newStatus) => onStatusChange(project.id, newStatus)}
          size="sm"
        />
      </div>
      <div className="hidden md:block text-cloud text-xs truncate">{project.notes || '—'}</div>
      <div className="flex gap-1">
        <button
          onClick={() => onDuplicate(project.id)}
          className="p-1.5 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
          title={t.projects.duplicate}
          aria-label={t.projects.duplicateProject}
        >
          <RiFileCopyLine className="w-4 h-4" />
        </button>
        <ProjectActionsMenu onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
      </div>
    </div>
  );
}

function ProjectList({
  projects,
  overdueIds,
  onDuplicate,
  onEdit,
  onDelete,
  onStatusChange,
  isSelectionMode,
  selectedProjectIds,
  onToggleSelect,
}: {
  projects: Project[];
  overdueIds: string[];
  onDuplicate: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  isSelectionMode: boolean;
  selectedProjectIds: string[];
  onToggleSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
      <div className="grid md:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] grid-cols-[auto_1fr_auto] gap-2 md:gap-4 px-3 md:px-6 py-3 text-xs text-cloud border-b border-cloud/20">
        <span></span> {/* ドラッグハンドルまたはチェックボックス用の空スペース */}
        <span>{t.projects.name}</span>
        <span className="hidden md:block">{t.projects.description}</span>
        <span className="hidden md:block">{t.projects.period}</span>
        <span className="hidden md:block">{t.projects.status}</span>
        <span className="hidden md:block">{t.projects.notesColumn}</span>
        <span>{t.projects.actions}</span>
      </div>
      {projects.map((project, index) => (
        <ProjectListRow
          key={project.id}
          project={project}
          isLast={index === projects.length - 1}
          overdue={overdueIds.includes(project.id)}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          isSelectionMode={isSelectionMode}
          isSelected={selectedProjectIds.includes(project.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

