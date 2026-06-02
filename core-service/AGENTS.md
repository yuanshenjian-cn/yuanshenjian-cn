# AGENTS.md — core-service 工程规范

本文件为 AI 编程助手在 `core-service/` 目录中的工作约束与目标工程规范。

> ⚠️ **当前状态**：`app/` 顶层已经收口为 `contexts/`、`shared/` 和 `main.py`，旧扁平结构（`app/api/`、`app/services/`、`app/db/`、`app/schemas/`、`app/core/`）已全部退出；新增代码必须遵循本规范，禁止恢复旧扁平结构。

---

## 技术栈

- **语言**: Python 3.12
- **框架**: FastAPI + SQLAlchemy 2.0 (ORM) / SQLModel
- **数据库**: SQLite（开发）/ PostgreSQL（生产）
- **迁移**: Alembic
- **校验工具**: Ruff + mypy（strict）+ pytest

---

## 必须遵守的架构约束

### 后端 DDD 分层架构规范

后端目标架构采用**按业务上下文组织的轻量 DDD**，顶层结构使用：

```
app/
├── contexts/<business_context>/   # 各业务上下文
│   ├── domain/                    # 领域层
│   ├── application/               # 应用层
│   ├── infra/                     # 基础设施层
│   └── interface/                 # 接口层
├── shared/                        # 跨上下文共享
│   ├── application/
│   ├── domain/
│   └── infra/                     # database.py、事务边界、通用基础设施
│   └── interface/
└── main.py
```

> 业务上下文（`contexts/<business_context>/`）的具体划分由后续重构方案定义，例如可能的候选包括评论、文章统计、AI 网关、知识库（RAG）、管理鉴权等；本规范不在此处枚举。

每个上下文内部采用按业务概念拆分的轻量 DDD 结构，命名规范如下：

- `domain/<business_entity>.py`：实体、聚合根及核心状态变化方法。
- `domain/<business_entity>_repository.py`：仓储抽象接口，只定义领域对象的加载与保存能力。
- `domain/events.py`：轻量领域事件对象，不引入事件总线 / outbox。
- `domain/exceptions.py`：领域异常，不依赖 HTTP。
- `application/<business_use_case>_app_service.py`：应用服务与用例编排。
- `application/dto/<use_case>_dto.py`：同一个 API / use case 的 request body 与 response body 放在同一个 DTO 文件中。
- `shared/application/<shared_concept>_dto.py`：跨上下文共享的通用响应 DTO 使用具体业务名文件，例如 `page_response_dto.py`、`filter_option_dto.py`；不要新增 `shared/application/dto.py` 这类泛名实现文件。
- `infra/po/<business_object>_po.py`：SQLModel / SQLAlchemy 持久化对象。
- `infra/dao/<business_object>_dao.py`：直接表操作对象，仅放数据库读写细节。
- `infra/sqlmodel_<business_entity>_repository.py`：核心聚合仓储实现，负责 domain / PO 映射并调用 DAO。
- `infra/<business_query>_query_service.py`：后台列表、筛选、投影等读模型查询。
- `interface/<business_route>_router.py`：FastAPI 路由、HTTP DTO 与异常映射。

### 文件粒度要求

- `interface` 层的 router、`application` 层的 service、`domain` 层的 entity 和 repository、`infra` 层的 repository 实现和 dao，必须**一类一 Python 文件**，文件名必须表达业务概念。
- 一个 `APIRouter` 对象对应一个 router 文件；不要新增 `interface/router.py` 这类泛名聚合文件。
- router 中构建应用服务的最佳实践是：
  - 提供 `build_*_service(session: Session)` 负责装配；
  - 提供 `get_*_service(session: Session = Depends(get_session))` 作为依赖注入入口；
  - 各 API 通过 `service: *AppService = Depends(get_*_service)` 获取服务，不在 endpoint 内重复调用 `build_*_service(...)`。
- 一个应用服务类对应一个 `application/*_app_service.py` 文件，类名统一使用 `*AppService` 后缀；不要新增 `application/services.py` 这类泛名聚合文件。
- 同一个 API / use case 的 request DTO 和 response DTO 必须放在同一个 `application/dto/<use_case>_dto.py` 文件中；类名分别使用 `*Req` 和 `*Resp` 后缀，例如 `CreateXxxReq`、`CreateXxxResp`。如果 response 表示列表中的单项元素，类名统一使用 `*ItemResp` 后缀，不使用 `List*Resp` 这类命名。
- `*Req`、`*Resp`、`*ItemResp` 的命名必须以表达 use case 的**动宾短语**开头，例如 `CreateXxxReq`、`ListYyyItemResp`。
- DTO 之间禁止继承关联；每一个 API / use case 都必须定义自己独有的 DTO，不通过继承复用其他 use case 的 `*Req`、`*Resp` 或 `*ItemResp`。
- 禁止新增 `domain/value_objects.py`。
- 一个实体或聚合根对应一个 entity 文件；与 entity 紧密关联且只服务该 entity 的 value object 必须放在对应 entity 文件内。
- 同一上下文内被多个实体、领域服务或 checker 复用的值对象，必须放入 `domain/vo/` 包，并按业务概念一类一文件。
- 一个仓储抽象对应一个 `domain/<business>_repository.py` 文件；一个 SQLModel 仓储实现对应一个 `infra/sqlmodel_<business>_repository.py` 文件。
- 一个表对应一个 dao 文件和 DAO 对象；命名使用 `infra/dao/<business>_dao.py`，类名统一使用 `*DAO` 后缀。
- 一个读模型查询服务对应一个 `infra/<business_query>_query_service.py` 文件；不要新增 `infra/query_services.py` 这类桥接或聚合文件。
- PO 类名统一使用 `*PO` 后缀，不使用 `*Po`。
- 禁止用 `commands.py`、`dto.py`、`entities.py`、`services.py`、`repositories.py`、`router.py` 作为新增业务文件名；迁移旧代码时也应逐步删除这类桥接文件。

### 依赖方向要求

- `domain` 不依赖 FastAPI、SQLModel、Session、Pydantic DTO 或具体数据库。
- `application` 依赖 `domain`、仓储接口和用例端口，不直接依赖 `Session`、SQLModel PO，不直接拼复杂 SQL，不承载核心业务规则。
- `infra` 依赖 `domain` 和数据库技术，负责 domain / PO 映射、仓储实现、dao、查询服务、文件读取、外部兼容适配。
- `interface` 只负责 HTTP 语义、参数接收、响应包装和异常映射，不写业务规则。
- 核心写模型通过 repository 加载和保存聚合；简单读模型可以使用 query service，不强制加载完整聚合。
- 新增核心业务规则必须优先放入 `domain`，不要继续堆在应用服务或路由里。
- query service 必须返回**显式构造**的读模型 dict 或 DTO，不要直接返回 `entity.__dict__` / `domain_object.__dict__`。

### repository / dao / po 职责要求

- `domain` 只定义 repository 抽象接口，不出现 SQLModel、Session、select、PO 类型。
- `infra` 的 repository 实现负责 domain 与 PO 的映射，仓储方法对 application 暴露领域对象或应用 DTO 所需的简单结果。
- `infra` 中的 repository 实现类**不能直接操作 `Session` 或直接编写表查询**；只能通过 DAO 对象访问数据库表。
- `DAO` 只封装表级别操作，不表达领域规则。
- `PO` 只表达数据库结构和索引约束，不写核心业务状态变化方法。
- 事务提交 / 回滚不属于 repository / dao / application / interface，统一遵守下方事务边界。
- 发布投影、快照构建等 SQLModel 具体实现文件，命名优先使用 `sqlmodel_*` 前缀表达技术实现，例如 `sqlmodel_xxx_projection_builder.py`。

### 领域建模原则

- 核心实体采用**面向对象建模**，实体负责自身状态变化，例如 `archive()`、`rename()`、`activate()`、`accept()`。
- 跨聚合规则使用领域服务或应用服务协调，不把多个聚合强行塞进一个大对象。
- 状态、类型、目标实体等受控语义必须使用**枚举或值对象**，禁止业务代码散落自由字符串。
- 领域异常使用 `DomainException` 体系，至少区分 `not found`、`conflict`、`validation`、`invalid state`，并带轻量错误码。
- 可以保留简单 read model 和 query service，避免为了后台列表页过度 DDD 化。

### 事务边界

事务提交 / 回滚只允许在 `core-service/app/shared/infra/database.py` 统一处理。

除非代码有特殊说明，否则禁止在以下层显式调用：

- `session.commit()`
- `session.rollback()`

允许的位置：

- `get_session()`
- `transactional_session()`

### 命名约束

- 业务命名必须使用**明确业务概念**，不引入空泛的命名（避免 `data`、`info`、`manager`、`handler` 等无信息量的词汇）。
- 内部业务代码、API、数据库物理表 / 列统一使用同一套业务术语；禁止 legacy 命名渗透到领域层。
- 如存在历史兼容入口或出口，必须通过 adapter 隔离，legacy 命名只允许出现在 adapter 的局部变量或外部 schema 字段。

---

## 迁移规则

- 数据库迁移必须通过 Alembic 生成，不要手写 revision 链。
- 在 `core-service/` 目录下生成新迁移：
  ```bash
  .venv/bin/python -m alembic -c alembic.ini revision --autogenerate -m "描述"
  ```
- 如果用户明确允许清库并重建 schema，可以重做初始化迁移或替换早期迁移，但必须保持 revision 链清晰，并验证迁移可执行。
- 不要提交空的 merge migration。
- 修改持久化模型（PO）后，必须检查是否需要生成迁移，并验证迁移可执行。

---

## 质量门禁

完成 core-service 改动前必须运行根目录定义的后端校验命令（Ruff + mypy strict + pytest）；涉及迁移变更还需验证迁移能正常执行。具体命令见根目录 `AGENTS.md`。

---

## 配置与环境变量

- 所有配置通过 `app/shared/config.py` 中的 `settings` 单例访问，禁止在其他文件直接读取 `os.environ`。
- 环境变量加载顺序：`.env` → `.env.{APP_ENV}` → `.env.local` → `.env.{APP_ENV}.local` → 系统环境变量。
- 不要提交 `.env.local` 或包含真实密钥的文件。
- 应用级配置（CORS、限流参数、AI 配置）放在 `config/app.yaml`，按 `default` / `development` / `production` 分段。
- LLM provider / profile 配置在 `config/ai/` 目录，不直接在代码中写 model ID 字符串。

---

## 文案与注释规则

- 注释、docstring、用户可见文案默认使用**中文**。
- 异常消息和接口错误提示默认使用**中文**。
- 日志输出（`logger.info` / `logger.error`）使用**英文**。
- 专有名词、协议名、字段名、库名保持项目既有叫法，不生硬翻译。
