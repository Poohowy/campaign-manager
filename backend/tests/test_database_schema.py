from sqlalchemy import Boolean, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB

from app.db import models  # noqa: F401
from app.db.base import Base


def test_all_expected_tables_exist() -> None:
    expected_tables = {
        "customers",
        "templates",
        "smtp_settings",
        "campaigns",
        "campaign_messages",
    }
    assert expected_tables.issubset(Base.metadata.tables.keys())


def test_foreign_keys_are_defined() -> None:
    campaigns = Base.metadata.tables["campaigns"]
    campaign_messages = Base.metadata.tables["campaign_messages"]

    campaign_fk_targets = {fk.target_fullname for fk in campaigns.foreign_keys}
    message_fk_targets = {fk.target_fullname for fk in campaign_messages.foreign_keys}

    assert "templates.id" in campaign_fk_targets
    assert "campaigns.id" in message_fk_targets
    assert "customers.id" in message_fk_targets


def test_unique_constraints_are_present() -> None:
    customers = Base.metadata.tables["customers"]
    smtp_settings = Base.metadata.tables["smtp_settings"]

    customer_unique_sets = {
        tuple(sorted(column.name for column in constraint.columns))
        for constraint in customers.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    smtp_unique_sets = {
        tuple(sorted(column.name for column in constraint.columns))
        for constraint in smtp_settings.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert ("external_id", "user_id") in customer_unique_sets
    assert ("user_id",) in smtp_unique_sets


def test_indexes_are_present() -> None:
    customers = Base.metadata.tables["customers"]
    templates = Base.metadata.tables["templates"]
    campaigns = Base.metadata.tables["campaigns"]
    campaign_messages = Base.metadata.tables["campaign_messages"]

    customer_indexes = {index.name for index in customers.indexes}
    template_indexes = {index.name for index in templates.indexes}
    campaign_indexes = {index.name for index in campaigns.indexes}
    message_indexes = {index.name for index in campaign_messages.indexes}

    assert {
        "ix_customers_user_id",
        "ix_customers_user_email",
        "ix_customers_user_company_name",
    }.issubset(customer_indexes)
    assert {"ix_templates_user_id", "ix_templates_user_name"}.issubset(template_indexes)
    assert {"ix_campaigns_user_id", "ix_campaigns_status", "ix_campaigns_created_at"}.issubset(
        campaign_indexes
    )
    assert {
        "ix_campaign_messages_campaign_id",
        "ix_campaign_messages_customer_id",
        "ix_campaign_messages_status",
        "ix_campaign_messages_user_id",
    }.issubset(message_indexes)


def test_jsonb_columns_and_defaults() -> None:
    customers = Base.metadata.tables["customers"]
    campaign_messages = Base.metadata.tables["campaign_messages"]

    customer_custom_fields = customers.c.custom_fields
    message_rendered_variables = campaign_messages.c.rendered_variables

    assert isinstance(customer_custom_fields.type, JSONB)
    assert isinstance(message_rendered_variables.type, JSONB)
    assert customer_custom_fields.server_default is not None
    assert message_rendered_variables.server_default is not None


def test_enum_columns_are_present() -> None:
    campaigns = Base.metadata.tables["campaigns"]
    campaign_messages = Base.metadata.tables["campaign_messages"]

    campaign_status = campaigns.c.status.type
    message_status = campaign_messages.c.status.type

    assert isinstance(campaign_status, Enum)
    assert isinstance(message_status, Enum)
    assert campaign_status.name == "campaign_status"
    assert message_status.name == "campaign_message_status"


def test_smtp_settings_has_use_tls_column() -> None:
    smtp_settings = Base.metadata.tables["smtp_settings"]
    use_tls = smtp_settings.c.use_tls

    assert isinstance(use_tls.type, Boolean)
    assert use_tls.nullable is False
