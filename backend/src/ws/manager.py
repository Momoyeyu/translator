import json
from uuid import UUID

from fastapi import WebSocket
from loguru import logger

from conf.redis import get_redis


class WebSocketManager:
    def __init__(self):
        self._connections: dict[UUID, set[WebSocket]] = {}

    async def connect(self, project_id: UUID, ws: WebSocket):
        await ws.accept()
        if project_id not in self._connections:
            self._connections[project_id] = set()
        self._connections[project_id].add(ws)
        logger.info(f"WebSocket connected for project {project_id}")

    def disconnect(self, project_id: UUID, ws: WebSocket):
        if project_id in self._connections:
            self._connections[project_id].discard(ws)
            if not self._connections[project_id]:
                del self._connections[project_id]
        logger.info(f"WebSocket disconnected for project {project_id}")

    async def broadcast(self, project_id: UUID, event: dict):
        if project_id not in self._connections:
            return
        dead = set()
        message = json.dumps(event)
        for ws in self._connections[project_id]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[project_id].discard(ws)

    async def listen_redis(self, project_id: UUID, ws: WebSocket):
        """Subscribe to Redis Pub/Sub and forward events to WebSocket."""
        r = get_redis()
        pubsub = r.pubsub()
        channel = f"project:{project_id}"
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await ws.send_text(message["data"].decode("utf-8"))
        except Exception:
            pass
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()


ws_manager = WebSocketManager()


async def publish_event(project_id: UUID, event: dict):
    """Publish event to Redis Pub/Sub channel and store for replay."""
    r = get_redis()
    channel = f"project:{project_id}"
    payload = json.dumps(event)
    await r.publish(channel, payload)

    # Store in sorted set for reconnection replay
    events_key = f"project_events:{project_id}"
    seq = event.get("seq", 0)
    await r.zadd(events_key, {payload: seq})
    await r.expire(events_key, 14400)  # 4h TTL
