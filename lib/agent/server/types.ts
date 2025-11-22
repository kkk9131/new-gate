export type AgentActionType =
    | 'SET_LAYOUT'
    | 'OPEN_APP'
    | 'UPDATE_STATUS'
    | 'ADD_MESSAGE'
    | 'LOG'
    | 'CLOSE_ALL';

export interface AgentAction {
    type: AgentActionType;
    payload: any;
}

export interface ServerUIController {
    setLayout(layout: 1 | 2 | 3 | 4): void;
    openApp(screenId: number, appId: string): void;
    updateStatus(screenId: number, status: string, progress?: number): void;
    log(screenId: number, message: string, level?: 'info' | 'warn' | 'error'): void;
    closeAll(): void;
}
