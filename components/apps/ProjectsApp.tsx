'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  RiAddLine,
  RiCalendarLine,
  RiFolderLine,
  RiListCheck,
  RiLayoutGridLine,
  RiFileCopyLine,
} from 'react-icons/ri';
import { ProjectFormModal } from './projects/ProjectFormModal';
import { ProjectDeleteDialog } from './projects/ProjectDeleteDialog';
import { ProjectActionsMenu } from './projects/ProjectActionsMenu';
import { ProjectStatusMenu } from './projects/ProjectStatusMenu';

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const statusLabel: Record<ProjectStatus, string> = {
  planning: '企画',
  active: '進行中',
  completed: '完了',
  on_hold: '保留',
};

const statusStyle: Record<ProjectStatus, string> = {
  planning: 'text-accent-sand',
  active: 'text-ink',
  completed: 'text-cloud',
  on_hold: 'text-cloud',
};

type ViewMode = 'card' | 'list';

export function ProjectsApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル・ダイアログの状態管理
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // プロジェクト一覧取得
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error('プロジェクトの取得に失敗しました');
      }

      const result = await response.json();
      setProjects(result.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
      throw new Error(error.error?.message || 'プロジェクトの作成に失敗しました');
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
      throw new Error(error.error?.message || 'プロジェクトの更新に失敗しました');
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
      throw new Error(error.error?.message || 'プロジェクトの削除に失敗しました');
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
        throw new Error('プロジェクトの複製に失敗しました');
      }

      // 一覧を再取得
      await fetchProjects();
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
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
        throw new Error(error.error?.message || 'ステータスの更新に失敗しました');
      }

      await fetchProjects();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
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
      <div className="p-6 h-full overflow-auto bg-mist text-ink flex items-center justify-center">
        <div className="text-cloud">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full overflow-auto bg-mist text-ink flex items-center justify-center">
        <div className="text-accent-sand">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink space-y-6">
      <Header viewMode={viewMode} onChangeView={setViewMode} onCreateClick={() => setIsCreateModalOpen(true)} />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-cloud">
          <RiFolderLine className="w-16 h-16 mb-4" />
          <p className="text-lg">プロジェクトがありません</p>
          <p className="text-sm">「新規」ボタンからプロジェクトを作成してください</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              overdue={overdueIds.includes(project.id)}
              onDuplicate={handleDuplicate}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
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
        />
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
  );
}

function Header({
  viewMode,
  onChangeView,
  onCreateClick,
}: {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-1">Projects</h2>
        <p className="text-sm text-cloud">プロジェクトを俯瞰し、AIに自然言語で操作を依頼できます</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <ViewToggle viewMode={viewMode} onChangeView={onChangeView} />
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors"
        >
          <RiAddLine className="w-4 h-4" /> 新規
        </button>
      </div>
    </div>
  );
}

function ViewToggle({ viewMode, onChangeView }: { viewMode: ViewMode; onChangeView: (mode: ViewMode) => void }) {
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
          aria-label={mode === 'card' ? 'カード表示' : 'リスト表示'}
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
}: {
  project: Project;
  overdue: boolean;
  onDuplicate: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
}) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl p-5 shadow-soft flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
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
            title="複製"
            aria-label="プロジェクトを複製"
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
          {overdue ? '⚠️ 期限切れ' : '✓ 期限内'}
        </p>
        {project.notes && <p className="text-xs">備考: {project.notes}</p>}
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
}: {
  projects: Project[];
  overdueIds: string[];
  onDuplicate: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
}) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
      <div className="grid grid-cols-6 px-6 py-3 text-xs text-cloud border-b border-cloud/20">
        <span>名称</span>
        <span>説明</span>
        <span>期間</span>
        <span>ステータス</span>
        <span>備考</span>
        <span>操作</span>
      </div>
      {projects.map((project) => (
        <div key={project.id} className="grid grid-cols-6 px-6 py-4 border-b border-cloud/10 text-sm items-center">
          <div className="font-medium">{project.name}</div>
          <div className="text-cloud text-xs truncate">{project.description || '—'}</div>
          <div className="text-cloud text-xs">
            {project.start_date}
            {project.end_date && ` - ${project.end_date}`}
            {overdueIds.includes(project.id) && <span className="ml-2 text-accent-sand">⚠️</span>}
          </div>
          <div>
            <ProjectStatusMenu
              currentStatus={project.status}
              onChange={(newStatus) => onStatusChange(project.id, newStatus)}
              size="sm"
            />
          </div>
          <div className="text-cloud text-xs truncate">{project.notes || '—'}</div>
          <div className="flex gap-1">
            <button
              onClick={() => onDuplicate(project.id)}
              className="p-1.5 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
              title="複製"
              aria-label="プロジェクトを複製"
            >
              <RiFileCopyLine className="w-4 h-4" />
            </button>
            <ProjectActionsMenu onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
          </div>
        </div>
      ))}
    </div>
  );
}

