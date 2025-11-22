import { AgentAction, ServerUIController } from './types';

export class ServerUIControllerImpl implements ServerUIController {
    private dispatch: (action: AgentAction) => void;

    constructor(dispatch: (action: AgentAction) => void) {
        this.dispatch = dispatch;
    }

    setLayout(layout: 1 | 2 | 3 | 4): void {
        this.dispatch({
            type: 'SET_LAYOUT',
            payload: { layout }
        });
    }

    openApp(screenId: number, appId: string): void {
        this.dispatch({
            type: 'OPEN_APP',
            payload: { screenId, appId }
        });
    }

    updateStatus(screenId: number, status: string, progress?: number): void {
        this.dispatch({
            type: 'UPDATE_STATUS',
            payload: { screenId, status, progress }
        });
    }

    log(screenId: number, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        this.dispatch({
            type: 'LOG',
            payload: { screenId, message, level }
        });
    }

    closeAll(): void {
        this.dispatch({
            type: 'CLOSE_ALL',
            payload: {}
        });
    }
}
