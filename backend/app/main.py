from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, departments, photos, users

app = FastAPI(title="Dept Photo Alerts")

# Wide open for now — the web app and the Capacitor-wrapped Android app both
# call this API, and we're using Bearer-token auth rather than cookies, so a
# permissive origin list is fine. Narrow this to your real frontend URL(s)
# once you have them if you'd like to lock it down further.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(users.router)
app.include_router(photos.router)


@app.get("/health")
async def health():
    """Point a free uptime pinger (e.g. UptimeRobot) at this endpoint every
    ~10 minutes during work hours to stop Render's free tier from spinning
    the service down and causing a slow first request."""
    return {"status": "ok"}
