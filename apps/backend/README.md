# BuildVerdict Backend (MVP)

NestJS + TypeORM + PostgreSQL. Минимальный скелет под основной сценарий:
случайная сборка на главной, лента всех сборок, оценка и обсуждение.

## Запуск

```bash
npm run db:up          # postgres в docker (порт из .env, по умолчанию 5430)
npm run db:seed        # наполнить базу примерами (перезаписывает таблицы)
npm run dev            # бэкенд и фронтенд одной командой
npm run backend        # только бэкенд: nest start --watch -> http://localhost:3001/api
npm run backend:build  # nest build -> apps/backend/dist
npm run backend:start  # запуск собранной версии
npm run backend:test   # jest: *.test.ts и *.spec.ts в apps/backend
```

Скрипты в корне парные: `dev`, `build`, `start`, `test` запускают оба приложения,
а `backend:*` и `frontend:*` — по отдельности.

Переменные окружения — в корневом `.env` (шаблон: `.env.example`).
Схема БД в MVP создаётся из сущностей (`synchronize: true`), миграций пока нет.

## Структура

```text
src/
  main.ts              точка входа: префикс /api, CORS, глобальная валидация
  app.module.ts        подключение TypeORM и доменных модулей
  database/            конфиг подключения и наполнение базы примерами
  heroes/              каталог героев (статичный список под ассеты фронтенда)
  builds/              сборки: сущность, DTO, сервис, контроллер
  votes/               оценки: positive | situational | negative
  comments/            общая ветка комментариев под сборкой
```

Каждый домен собран по одной схеме: `*.entity.ts`, `dto/`, `*.service.ts`,
`*.controller.ts`, `*.module.ts`. Отдельного слоя представления нет: сервисы
возвращают сущности, а контроллеры отдают их как есть. Скрытые поля помечены
`@Exclude()` и вырезаются глобальным `ClassSerializerInterceptor`.

## API

| Метод  | Путь                          | Назначение                                  |
| ------ | ----------------------------- | ------------------------------------------- |
| GET    | `/api/heroes`                 | каталог героев                              |
| GET    | `/api/heroes/random`          | случайный герой                             |
| GET    | `/api/heroes/:id`             | герой по id                                 |
| GET    | `/api/builds`                 | лента сборок, от новых к старым             |
| GET    | `/api/builds/random`          | случайная сборка для главной страницы       |
| GET    | `/api/builds/:id`             | сборка вместе с голосами и комментариями    |
| POST   | `/api/builds`                 | публикация сборки                           |
| POST   | `/api/builds/:id/votes`       | оценка (повторная заменяет прежнюю)         |
| GET    | `/api/builds/:id/comments`    | комментарии сборки                          |
| POST   | `/api/builds/:id/comments`    | новый комментарий                           |

Пример публикации:

```bash
curl -X POST http://localhost:3001/api/builds \
  -H "Content-Type: application/json" \
  -d '{"title":"Pudge without hook","heroId":"pudge","items":["blade_mail","heart"],"author":"MeatWagon"}'
```

## Осознанные упрощения MVP

- нет авторизации: автор — свободное имя, голос привязан к `voterKey` клиента
  (наружу поле не отдаётся);
- сборка отдаёт `heroId`, данные героя клиент берёт из `/api/heroes`;
- голоса и комментарии приходят массивами, счётчики считает клиент;
- каталог героев статичный, каталог предметов не валидируется;
- предметы хранятся массивом идентификаторов внутри сборки;
- нет миграций, пагинации, репутации и модерации.
