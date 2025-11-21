export type AgentActionType =
    | 'SET_LAYOUT'
    | 'OPEN_APP'
    | 'UPDATE_STATUS'
    | 'ADD_MESSAGE';

export interface AgentAction {
    type: AgentActionType;
    payload: any;
}

export interface ServerUIController {
    setLayout(layout: 1 | 2 | 3 | 4): void;
    openApp(screenId: number, appId: string): void;
    updateStatus(screenId: number, status: string, progress?: number): void;
}
