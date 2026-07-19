import re
import uuid

from app.db.models import Customer
from app.repositories.customer_repository import CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerDeleteResult
from app.schemas.customer_import import CustomerImportMapping, CustomerImportResult
from app.services.customer_import_service import (
    CustomerImportService,
    CustomerImportValidationError,
)


class CustomerService:
    EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

    def __init__(self, repository: CustomerRepository):
        self.repository = repository
        self.import_parser = CustomerImportService()

    def list_customers(
        self,
        *,
        user_id: uuid.UUID,
        page: int,
        page_size: int,
        search: str | None,
        sort: str,
        order: str,
    ) -> tuple[list[Customer], int]:
        safe_sort_fields = {"created_at", "company_name", "contact_name", "email"}
        safe_sort = sort if sort in safe_sort_fields else "created_at"
        safe_order = "asc" if order == "asc" else "desc"
        offset = (page - 1) * page_size

        customers = self.repository.list_by_user(
            user_id,
            offset=offset,
            limit=page_size,
            search=search,
            sort=safe_sort,
            order=safe_order,
        )
        total = self.repository.count_by_user(user_id, search=search)
        return customers, total

    def get_customer_by_id(self, *, user_id: uuid.UUID, customer_id: uuid.UUID) -> Customer | None:
        return self.repository.get_by_user_and_id(user_id, customer_id)

    def upsert_customer(self, *, user_id: uuid.UUID, payload: CustomerCreate) -> Customer:
        existing = self.repository.get_by_user_and_external_id(user_id, payload.external_id)
        values = payload.model_dump(exclude={"user_id"})

        if existing is None:
            return self.repository.create(user_id=user_id, **values)

        return self.repository.update(existing, **values)

    def delete_customers(
        self,
        *,
        user_id: uuid.UUID,
        customer_ids: list[uuid.UUID],
    ) -> CustomerDeleteResult:
        deleted_count = self.repository.delete_by_user_ids(user_id, customer_ids)
        return CustomerDeleteResult(deleted=deleted_count)

    def import_customers(
        self,
        *,
        user_id: uuid.UUID,
        file_content: bytes,
        mapping: CustomerImportMapping,
    ) -> CustomerImportResult:
        headers, rows = self.import_parser.parse_csv(file_content=file_content)
        self._validate_mapping_headers(mapping=mapping, headers=headers)

        imported = 0
        updated = 0
        skipped = 0

        mapped_headers = {
            header
            for header in mapping.model_dump().values()
            if isinstance(header, str) and header.strip()
        }

        for row in rows:
            external_id = self._clean_value(row.get(mapping.external_id))
            company_name = self._clean_value(row.get(mapping.company_name))
            email = self._clean_value(row.get(mapping.email))

            if (
                not external_id
                or not company_name
                or not email
                or not self.EMAIL_PATTERN.fullmatch(email)
            ):
                skipped += 1
                continue

            contact_name = (
                self._clean_value(row.get(mapping.contact_name)) if mapping.contact_name else None
            )
            phone = self._clean_value(row.get(mapping.phone)) if mapping.phone else None

            custom_fields: dict[str, object] = {}
            website = self._clean_value(row.get(mapping.website)) if mapping.website else None
            city = self._clean_value(row.get(mapping.city)) if mapping.city else None
            country = self._clean_value(row.get(mapping.country)) if mapping.country else None

            if website:
                custom_fields["website"] = website
            if city:
                custom_fields["city"] = city
            if country:
                custom_fields["country"] = country

            for header, value in row.items():
                if header in mapped_headers:
                    continue
                cleaned_value = self._clean_value(value)
                if cleaned_value:
                    custom_fields[header] = cleaned_value

            existing = self.repository.get_by_user_and_external_id(user_id, external_id)
            if existing is None:
                payload = CustomerCreate(
                    user_id=user_id,
                    external_id=external_id,
                    email=email,
                    company_name=company_name,
                    contact_name=contact_name,
                    phone=phone,
                    custom_fields=custom_fields,
                )
                self.repository.create(user_id=user_id, **payload.model_dump(exclude={"user_id"}))
                imported += 1
                continue

            merged_custom_fields = {
                **(existing.custom_fields or {}),
                **custom_fields,
            }
            update_values: dict[str, object] = {
                "external_id": external_id,
                "email": email,
                "company_name": company_name,
                "custom_fields": merged_custom_fields,
            }
            if mapping.contact_name:
                update_values["contact_name"] = contact_name
            if mapping.phone:
                update_values["phone"] = phone

            self.repository.update(existing, **update_values)
            updated += 1

        return CustomerImportResult(imported=imported, updated=updated, skipped=skipped)

    @staticmethod
    def _clean_value(value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None

    @staticmethod
    def _validate_mapping_headers(*, mapping: CustomerImportMapping, headers: list[str]) -> None:
        header_set = set(headers)
        for field_name, header in mapping.model_dump().items():
            if header and header not in header_set:
                raise CustomerImportValidationError(
                    code="IMPORT_MAPPING_INVALID",
                    message=f"Mapped column for '{field_name}' was not found in the CSV headers.",
                )
