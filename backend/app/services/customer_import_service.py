import csv
import io

from app.schemas.customer_import import CustomerImportPreview


class CustomerImportValidationError(Exception):
    def __init__(self, *, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class CustomerImportService:
    SUPPORTED_DELIMITERS = ",;\t"

    def generate_preview(self, *, file_content: bytes) -> CustomerImportPreview:
        headers, data_rows = self.parse_csv(file_content=file_content)
        preview_rows = data_rows[:10]
        return CustomerImportPreview(
            headers=headers,
            preview=preview_rows,
            row_count=len(data_rows),
        )

    def parse_csv(self, *, file_content: bytes) -> tuple[list[str], list[dict[str, str]]]:
        if not file_content:
            raise CustomerImportValidationError(
                code="CSV_FILE_EMPTY",
                message="CSV file is empty.",
            )

        try:
            text_content = file_content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise CustomerImportValidationError(
                code="CSV_FILE_INVALID",
                message="CSV file must be UTF-8 encoded and readable.",
            ) from exc

        if not text_content.strip():
            raise CustomerImportValidationError(
                code="CSV_FILE_EMPTY",
                message="CSV file is empty.",
            )

        if "\x00" in text_content:
            raise CustomerImportValidationError(
                code="CSV_FILE_INVALID",
                message="CSV file contains invalid characters.",
            )

        try:
            dialect = self._detect_dialect(text_content)
            csv_rows = list(csv.reader(io.StringIO(text_content), dialect=dialect))
        except csv.Error as exc:
            raise CustomerImportValidationError(
                code="CSV_FILE_INVALID",
                message="CSV file is not readable.",
            ) from exc

        if not csv_rows:
            raise CustomerImportValidationError(
                code="CSV_FILE_EMPTY",
                message="CSV file is empty.",
            )

        headers = [header.strip() for header in csv_rows[0]]
        if not headers or any(not header for header in headers):
            raise CustomerImportValidationError(
                code="CSV_HEADERS_INVALID",
                message="CSV headers are missing or invalid.",
            )

        data_rows = [row for row in csv_rows[1:] if self._is_non_empty_row(row)]
        parsed_rows = [self._row_to_record(headers, row) for row in data_rows]
        return headers, parsed_rows

    @staticmethod
    def _is_non_empty_row(row: list[str]) -> bool:
        return any(cell.strip() for cell in row)

    @staticmethod
    def _row_to_record(headers: list[str], row: list[str]) -> dict[str, str]:
        record: dict[str, str] = {}
        for index, header in enumerate(headers):
            record[header] = row[index].strip() if index < len(row) else ""
        return record

    def _detect_dialect(self, text_content: str) -> csv.Dialect:
        sample = text_content[:4096]
        try:
            return csv.Sniffer().sniff(sample, delimiters=self.SUPPORTED_DELIMITERS)
        except csv.Error:
            return csv.get_dialect("excel")
