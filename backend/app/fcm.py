from typing import Optional

import firebase_admin
from firebase_admin import credentials, messaging

from .config import settings

_app = None


def _get_app():
    global _app
    if _app is None:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        _app = firebase_admin.initialize_app(cred)
    return _app


def send_to_tokens(tokens: list[str], title: str, body: str, image_url: Optional[str] = None) -> None:
    """Push a notification to a batch of device tokens. Failures on individual
    tokens (e.g. the app was uninstalled) are logged and skipped rather than
    raised, so one stale token can't break the whole send."""
    if not tokens:
        return
    _get_app()
    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body, image=image_url),
        tokens=tokens,
    )
    try:
        response = messaging.send_each_for_multicast(message)
        if response.failure_count:
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    print(f"FCM push failed for token ...{tokens[idx][-6:]}: {resp.exception}")
    except Exception as exc:
        print(f"FCM multicast send failed: {exc}")
