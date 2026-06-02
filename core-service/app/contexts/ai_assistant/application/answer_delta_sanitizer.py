from __future__ import annotations

from collections.abc import Callable


class AnswerDeltaSanitizer:
    def __init__(self, on_delta: Callable[[str], None]) -> None:
        self._on_delta = on_delta
        self._pending_hyphen = False

    def push(self, delta: str) -> None:
        if not delta:
            return

        sanitized: list[str] = []
        for character in delta:
            if self._pending_hyphen:
                if character == "-":
                    sanitized.append("——")
                    self._pending_hyphen = False
                    continue
                sanitized.append("-")
                self._pending_hyphen = False

            if character == "-":
                self._pending_hyphen = True
                continue

            sanitized.append(character)

        if sanitized:
            self._on_delta("".join(sanitized))

    def finish(self) -> None:
        if not self._pending_hyphen:
            return
        self._pending_hyphen = False
        self._on_delta("-")
