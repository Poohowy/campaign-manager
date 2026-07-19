import csv

import pytest

from app.services.customer_import_service import (
    CustomerImportService,
    CustomerImportValidationError,
)


def test_generate_preview_detects_headers_and_preview_rows() -> None:
    service = CustomerImportService()
    csv_content = (
        b"external_id,company_name,email\n"
        b"ext-1,ACME,hello@acme.com\n"
        b"ext-2,Globex,hello@globex.com\n"
    )

    preview = service.generate_preview(file_content=csv_content)

    assert preview.headers == ["external_id", "company_name", "email"]
    assert preview.row_count == 2
    assert preview.preview == [
        {
            "external_id": "ext-1",
            "company_name": "ACME",
            "email": "hello@acme.com",
        },
        {
            "external_id": "ext-2",
            "company_name": "Globex",
            "email": "hello@globex.com",
        },
    ]


def test_generate_preview_handles_empty_file() -> None:
    service = CustomerImportService()

    with pytest.raises(CustomerImportValidationError) as error:
        service.generate_preview(file_content=b"")

    assert error.value.code == "CSV_FILE_EMPTY"
    assert error.value.message == "CSV file is empty."


def test_generate_preview_rejects_invalid_csv() -> None:
    service = CustomerImportService()

    with pytest.raises(CustomerImportValidationError) as error:
        service.generate_preview(file_content=b"external_id,email\nrow\x00value,hello@acme.com")

    assert error.value.code == "CSV_FILE_INVALID"
    assert error.value.message == "CSV file contains invalid characters."


def test_generate_preview_supports_semicolon_delimiter() -> None:
    service = CustomerImportService()
    csv_content = (
        b"external_id;company_name;email\n"
        b"ext-1;ACME;hello@acme.com\n"
    )

    preview = service.generate_preview(file_content=csv_content)

    assert preview.headers == ["external_id", "company_name", "email"]
    assert preview.row_count == 1
    assert preview.preview[0]["company_name"] == "ACME"


def test_generate_preview_supports_tab_delimiter() -> None:
    service = CustomerImportService()
    csv_content = (
        b"external_id\tcompany_name\temail\n"
        b"ext-1\tACME\thello@acme.com\n"
    )

    preview = service.generate_preview(file_content=csv_content)

    assert preview.headers == ["external_id", "company_name", "email"]
    assert preview.row_count == 1
    assert preview.preview[0]["email"] == "hello@acme.com"


def test_generate_preview_falls_back_to_comma_when_sniffer_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = CustomerImportService()

    def raise_sniffer_error(*args, **kwargs):
        raise csv.Error("sniffer failed")

    monkeypatch.setattr(csv.Sniffer, "sniff", raise_sniffer_error)

    csv_content = (
        b"external_id,company_name,email\n"
        b"ext-1,ACME,hello@acme.com\n"
    )
    preview = service.generate_preview(file_content=csv_content)

    assert preview.headers == ["external_id", "company_name", "email"]
    assert preview.row_count == 1
