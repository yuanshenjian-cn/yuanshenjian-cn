from __future__ import annotations

import asyncio
from argparse import ArgumentParser
from pathlib import Path

from app.contexts.knowledge_base.application.sync_published_content_into_knowledge_base_app_service import (
    SyncPublishedContentIntoKnowledgeBaseAppService,
)
from app.contexts.knowledge_base.infra.published_content_sync_service import PublishedContentSyncService


def _default_repo_root() -> Path:
    current = Path.cwd()
    return current.parent if current.name == "core-service" else current


async def async_main() -> None:
    parser = ArgumentParser(description="同步公开内容到知识库。")
    parser.add_argument("--repo-root", default=str(_default_repo_root()))
    parser.add_argument("--commit-sha", default="")
    args = parser.parse_args()

    sync_run = await SyncPublishedContentIntoKnowledgeBaseAppService(PublishedContentSyncService()).execute(
        Path(args.repo_root).resolve(),
        args.commit_sha,
    )
    print(
        "RAG sync finished: "
        f"status={sync_run.status}, "
        f"documents_seen={sync_run.documents_seen}, "
        f"documents_upserted={sync_run.documents_upserted}, "
        f"chunks_upserted={sync_run.chunks_upserted}, "
        f"chunks_deleted={sync_run.chunks_deleted}"
    )


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
