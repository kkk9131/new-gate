'use client';

import { useMemo, useState } from 'react';
import {
  RiAddLine,
  RiAttachmentLine,
  RiCalendarLine,
  RiFolderLine,
  RiListCheck,
  RiMoreLine,
  RiStackLine,
  RiLayoutGridLine,
} from 'react-icons/ri';

type ProjectStatus = 'active' | 'completed' | 'on_hold';

type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  owner: string;
  attachments: { id: string; name: string; type: string }[];
};

const projects: Project[] = [
  {
    id: 'pjt-1',
    name: 'ウェブサイトリニューアル',
    description: 'ブランド刷新に伴う新規デザインとCMS移行。',
    status: 'active',
    progress: 72,
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    owner: '山田花子',
    attachments: [
      { id: 'f1', name: '要件定義.docx', type: 'doc' },
      { id: 'f2', name: 'ワイヤー.png', type: 'img' },
    ],
  },
  {
    id: 'pjt-2',
    name: 'モバイルアプリ開発',
    description: 'iOS/Android両対応のプロジェクト管理アプリ。',
    status: 'on_hold',
    progress: 40,
    startDate: '2025-08-15',
    endDate: '2025-12-20',
    owner: '佐藤健',
    attachments: [{ id: 'f3', name: 'UI Kit.fig', type: 'fig' }],
  },
  {
    id: 'pjt-3',
    name: 'マーケティングキャンペーン',
    description: '年末のキャンペーン施策とLP最適化。',
    status: 'completed',
    progress: 100,
    startDate: '2025-07-01',
    endDate: '2025-09-30',
    owner: '王 小龍',
    attachments: [
      { id: 'f4', name: '結果レポート.pdf', type: 'pdf' },
      { id: 'f5', name: '素材.zip', type: 'zip' },
      { id: 'f6', name: '広告案.xlsx', type: 'xls' },
    ],
  },
];

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

  const overdueIds = useMemo(() => {
    const today = new Date();
    return projects
      .filter((p) => new Date(p.endDate) < today && p.progress < 100)
      .map((p) => p.id);
  }, []);

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink space-y-6">
      <Header viewMode={viewMode} onChangeView={setViewMode} />

      {viewMode === 'card' ? (
        <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} overdue={overdueIds.includes(project.id)} />
          ))}
        </div>
      ) : (
        <ProjectList projects={projects} overdueIds={overdueIds} />
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

function ProjectCard({ project, overdue }: { project: Project; overdue: boolean }) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl p-5 shadow-soft flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <RiFolderLine className="w-5 h-5 text-cloud" />
            <span className={`text-xs ${statusStyle[project.status]}`}>{statusLabel[project.status]}</span>
          </div>
          <h3 className="text-lg font-semibold mt-1">{project.name}</h3>
          <p className="text-sm text-cloud line-clamp-2">{project.description}</p>
        </div>
        <button className="p-2 rounded-full text-cloud hover:bg-cloud/20">
          <RiMoreLine className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <ProgressCircle value={project.progress} />
        <div className="text-sm text-cloud space-y-1">
          <p className="flex items-center gap-2">
            <RiCalendarLine className="w-4 h-4" />
            <span>
              {project.startDate} - {project.endDate}
            </span>
          </p>
          <p className={`text-xs ${overdue ? 'text-accent-sand' : 'text-cloud'}`}>
            {overdue ? '期限切れ' : '期限内'}
          </p>
          <p>担当: {project.owner}</p>
        </div>
      </div>

      <AttachmentRow attachments={project.attachments} />
    </div>
  );
}

function ProjectList({ projects, overdueIds }: { projects: Project[]; overdueIds: string[] }) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
      <div className="grid grid-cols-6 px-6 py-3 text-xs text-cloud border-b border-cloud/20">
        <span>名称</span>
        <span>期間</span>
        <span>担当</span>
        <span>ステータス</span>
        <span>進捗</span>
        <span>添付</span>
      </div>
      {projects.map((project) => (
        <div key={project.id} className="grid grid-cols-6 px-6 py-4 border-b border-cloud/10 text-sm items-center">
          <div className="font-medium">{project.name}</div>
          <div className="text-cloud text-xs">
            {project.startDate} - {project.endDate}
          </div>
          <div className="text-cloud text-xs">{project.owner}</div>
          <div className={`text-xs ${statusStyle[project.status]}`}>{statusLabel[project.status]}</div>
          <div>
            <div className="flex justify-between text-xs text-cloud">
              <span>{project.progress}%</span>
              <span className={overdueIds.includes(project.id) ? 'text-accent-sand' : ''}>
                {overdueIds.includes(project.id) ? '期限切れ' : ''}
              </span>
            </div>
            <div className="h-2 bg-cloud/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-calm rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
          <AttachmentRow attachments={project.attachments} compact />
        </div>
      ))}
    </div>
  );
}

function AttachmentRow({ attachments, compact }: { attachments: Project['attachments']; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      {attachments.map((file) => (
        <span key={file.id} className="px-2 py-1 rounded-full border border-cloud/30 text-cloud flex items-center gap-1">
          <RiAttachmentLine className="w-3 h-3" />
          {compact ? file.type.toUpperCase() : file.name}
        </span>
      ))}
      <button className="px-2 py-1 rounded-full border border-dashed border-cloud/40 text-cloud flex items-center gap-1">
        <RiStackLine className="w-3 h-3" />
        添付
      </button>
    </div>
  );
}

function ProgressCircle({ value }: { value: number }) {
  const offset = Math.min(Math.max(value, 0), 100);
  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16" viewBox="0 0 36 36">
        <path
          className="text-cloud/40"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="text-accent-calm"
          strokeDasharray={`${offset}, 100`}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{offset}%</div>
    </div>
  );
}
