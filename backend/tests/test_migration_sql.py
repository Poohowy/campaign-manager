import io
from pathlib import Path

from alembic.config import Config

from alembic import command


def test_initial_migration_renders_expected_sql(capsys) -> None:
    backend_root = Path(__file__).resolve().parents[1]
    config = Config(str(backend_root / "alembic.ini"))
    config.stdout = io.StringIO()

    command.upgrade(config, "head", sql=True)

    sql = capsys.readouterr().out.lower()

    assert "create type campaign_status as enum" in sql
    assert "create type campaign_message_status as enum" in sql
    assert "create table customers" in sql
    assert "create table templates" in sql
    assert "create table smtp_settings" in sql
    assert "use_tls" in sql
    assert "create table campaigns" in sql
    assert "create table campaign_messages" in sql
