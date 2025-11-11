'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  RiAddLine,
  RiCalendarLine,
  RiFolderLine,
  RiListCheck,
  RiMoreLine,
  RiLayoutGridLine,
  RiFileCopyLine,
} from 'react-icons/ri';

type ProjectStatus = 'active' | 'completed' | 'on_hold';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
};

const statusLabel: Record<ProjectStatus, string> = {
  active: '進行中',
  completed: '完了',
  on_hold: '保留',
};

const statusStyle: Record<ProjectStatus, string> = {
  active: 'text-ink',
  completed: 'text-cloud',
  on_hold: 'text-accent-sand',
};

type ViewMode = 'card' | 'list';

export function ProjectsApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <Header viewMode={viewMode} onChangeView={setViewMode} />

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
            />
          ))}
        </div>
      ) : (
        <ProjectList projects={projects} overdueIds={overdueIds} onDuplicate={handleDuplicate} />
      )}
    </div>
  );
}

function Header({ viewMode, onChangeView }: { viewMode: ViewMode; onChangeView: (mode: ViewMode) => void }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-1">Projects</h2>
        <p className="text-sm text-cloud">プロジェクトを俯瞰し、AIに自然言語で操作を依頼できます</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <ViewToggle viewMode={viewMode} onChangeView={onChangeView} />
        <button className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full">
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
}: {
  project: Project;
  overdue: boolean;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl p-5 shadow-soft flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <RiFolderLine className="w-5 h-5 text-cloud" />
            <span className={`text-xs ${statusStyle[project.status]}`}>{statusLabel[project.status]}</span>
          </div>
          <h3 className="text-lg font-semibold mt-1">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-cloud line-clamp-2 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onDuplicate(project.id)}
            className="p-2 rounded-full text-cloud hover:bg-cloud/20"
            title="複製"
            aria-label="プロジェクトを複製"
          >
            <RiFileCopyLine className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full text-cloud hover:bg-cloud/20" title="その他" aria-label="その他のオプション">
            <RiMoreLine className="w-5 h-5" />
          </button>
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
        {project.budget && (
          <p className="text-xs">
            予算: ¥{project.budget.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectList({
  projects,
  overdueIds,
  onDuplicate,
}: {
  projects: Project[];
  overdueIds: string[];
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
      <div className="grid grid-cols-6 px-6 py-3 text-xs text-cloud border-b border-cloud/20">
        <span>名称</span>
        <span>説明</span>
        <span>期間</span>
        <span>ステータス</span>
        <span>予算</span>
        <span>操作</span>
      </div>
      {projects.map((project) => (
        <div key={project.id} className="grid grid-cols-6 px-6 py-4 border-b border-cloud/10 text-sm items-center">
          <div className="font-medium">{project.name}</div>
          <div className="text-cloud text-xs truncate">
            {project.description || '—'}
          </div>
          <div className="text-cloud text-xs">
            {project.start_date}
            {project.end_date && ` - ${project.end_date}`}
            {overdueIds.includes(project.id) && (
              <span className="ml-2 text-accent-sand">⚠️</span>
            )}
          </div>
          <div className={`text-xs ${statusStyle[project.status]}`}>
            {statusLabel[project.status]}
          </div>
          <div className="text-cloud text-xs">
            {project.budget ? `¥${project.budget.toLocaleString()}` : '—'}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onDuplicate(project.id)}
              className="p-1.5 rounded-full text-cloud hover:bg-cloud/20"
              title="複製"
              aria-label="プロジェクトを複製"
            >
              <RiFileCopyLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

