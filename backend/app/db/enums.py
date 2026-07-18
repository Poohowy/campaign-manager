from enum import StrEnum


class CampaignStatus(StrEnum):
    draft = "draft"
    running = "running"
    completed = "completed"
    failed = "failed"


class CampaignMessageStatus(StrEnum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
