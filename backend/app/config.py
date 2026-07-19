from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase dashboard -> Project Settings -> Database -> Connection string -> URI
    # Copy it, then change "postgresql://" to "postgresql+asyncpg://" at the start.
    database_url: str

    # Supabase dashboard -> Project Settings -> API
    supabase_url: str
    supabase_service_key: str  # the service_role key (NOT the anon key) — needed to upload photos
    supabase_bucket: str = "photos"

    # Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.
    # Save the downloaded JSON in this backend folder and point this at its filename.
    firebase_credentials_path: str = "firebase-service-account.json"
    firebase_credentials_json: str | None = None

    # Any long random string. Generate one with:
    #   python -c "import secrets; print(secrets.token_hex(32))"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 30  # 30 days — internal tool, avoid re-login friction

    


settings = Settings()
