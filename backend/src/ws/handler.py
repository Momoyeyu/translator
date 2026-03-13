from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from middleware.auth import verify_token
from ws.manager import ws_manager

router = APIRouter()


@router.websocket("/ws/project/{project_id}")
async def project_websocket(ws: WebSocket, project_id: UUID, token: str = Query(...)):
    # Authenticate via query parameter token
    try:
        verify_token(token)
    except Exception:
        await ws.close(code=4401)
        return

    await ws_manager.connect(project_id, ws)
    try:
        await ws_manager.listen_redis(project_id, ws)
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(project_id, ws)
