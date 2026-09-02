# План авторизации BuildVerdict

Документ фиксирует принятые решения по аутентификации и порядок работ. Стек: NestJS 11 + Prisma 7 (PostgreSQL) на бэкенде, vinext/React на Cloudflare Workers на фронтенде, Redis из `docker-compose.yml`.

## Принятые решения

| Вопрос | Решение |
| --- | --- |
| Механизм | JWT: короткий access + долгоживущий refresh с ротацией |
| Access-токен | 15 минут, подпись HS256, хранится только в памяти JS на клиенте |
| Refresh-токен | 30 дней, ротация при каждом обновлении, серверное состояние в **Redis** |
| Cookie | Не используем вообще — ни для access, ни для refresh |
| Способы входа | Email + пароль и Google OAuth. Apple и SSO не делаем, кнопок в UI нет |
| Верификация почты | Опциональная: вход работает без неё, но публикация билдов и комментариев — только для подтверждённых |
| Сброс пароля | Через письмо со ссылкой (`Forgot password?` из макета) |
| Двухфакторка | Не делаем |
| Капча | Cloudflare Turnstile на формах логина, регистрации и сброса пароля |
| Сессии Express | `express-session` + `connect-redis` удаляем полностью |

## Модель токенов

### Access-токен

- Payload: `sub` (user id), `email`, `role`, `isVerified`, `jti`, `exp`.
- Живёт 15 минут, не хранится на сервере, проверяется только по подписи.
- Передаётся в заголовке `Authorization: Bearer <access>`.
- Клиент держит его в переменной в памяти (React-контекст / модуль), не в Web Storage.

### Refresh-токен

- Опаковая случайная строка (32 байта из `crypto.randomBytes`, base64url) — не JWT, чтобы ничего не утекало из payload.
- Состояние живёт в Redis:
  - `refresh:{userId}:{jti}` → JSON `{ tokenHash, familyId, userAgent, ip, createdAt }`, TTL 30 дней;
  - `refresh:user:{userId}` → SET из `jti` для «выйти на всех устройствах»;
  - `refresh:family:{familyId}` → маркер семьи для детекта переиспользования.
- В Redis лежит только SHA-256 хеш токена, сам токен сервер не хранит.
- Клиент передаёт refresh в теле запроса `POST /auth/refresh` (`{ "refreshToken": "..." }`), а хранит его в `localStorage` (ключ `buildverdict.refresh`). Это прямое следствие отказа от cookie; риск — XSS, поэтому строгий CSP на фронте обязателен.
- Формат токена: `<userId>.<jti>.<secret>`. Идентификаторы нужны, чтобы найти запись в Redis, секрет сверяется по хешу.

### Ротация и детект переиспользования

1. На `POST /auth/refresh` сервер хеширует пришедший токен и ищет запись в Redis.
2. Запись найдена → выдаём новую пару, старый `jti` удаляем, новый пишем с тем же `familyId`, TTL отсчитывается заново (sliding-окно, 30 дней от последнего обновления).
3. Записи нет, но `familyId` из связанной цепочки ещё жив → это переиспользование уже отозванного токена. Убиваем всю семью (все `jti` пользователя из этой семьи), возвращаем 401, пользователь логинится заново.
4. Записи нет и семьи нет → просто 401.

Логин создаёт новую семью (новое устройство), refresh продолжает существующую.

## Схема базы

Меняем `apps/backend/prisma/schema.prisma`:

- `User.password` делаем nullable — у пользователей, пришедших через Google, пароля нет.
- В `AuthMethod` оставляем `CREDENTIALS` и `GOOGLE`, `GITHUB` убираем миграцией.
- `Token` (модель для одноразовых токенов писем) оставляем, `TWO_FACTOR` из `TokenType` убираем — двухфакторку не делаем.
- `Account` используем для связи с Google: `provider = 'google'`, `providerAccountId`, токены провайдера.
- `Build.author` и будущие комментарии переводим на `userId` с внешним ключом на `User` вместо строки.

Отдельная таблица под refresh-токены не нужна — состояние целиком в Redis.

## Эндпоинты

| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | `/auth/register` | Email, пароль, displayName, Turnstile-токен. Пароль через argon2id. Отправляет письмо верификации |
| POST | `/auth/login` | Email + пароль + Turnstile. Возвращает пару токенов и профиль |
| POST | `/auth/refresh` | Ротация пары по refresh-токену |
| POST | `/auth/logout` | Удаляет текущий `jti` из Redis |
| POST | `/auth/logout-all` | Удаляет все `jti` пользователя |
| GET | `/auth/google` | Редирект на согласие Google |
| GET | `/auth/google/callback` | Обмен кода, создание/связывание пользователя, редирект на фронт с одноразовым кодом |
| POST | `/auth/google/exchange` | Обмен одноразового кода на пару токенов (код живёт 60 секунд) |
| POST | `/auth/verify-email` | Подтверждение почты по токену из письма |
| POST | `/auth/resend-verification` | Повторная отправка письма, с троттлингом |
| POST | `/auth/password-reset/request` | Письмо со ссылкой сброса, Turnstile |
| POST | `/auth/password-reset/confirm` | Новый пароль по токену, инвалидирует все refresh-токены пользователя |
| GET | `/auth/me` | Текущий профиль по access-токену |

Ответ логина и refresh: `{ accessToken, refreshToken, expiresIn, user: { id, email, displayName, picture, role, isVerified, muted, mutedUntil, muteReason } }`.

Поля мута нужны интерфейсу до отправки: композер комментариев показывает срок и причину, а не общее «нельзя». В токене их нет — мут проверяется в базе (`NotMutedGuard`), иначе выданный до мута access продолжал бы писать все 15 минут.

## Guards и декораторы

- `JwtAuthGuard` — глобальный, снимается декоратором `@Public()` для открытых маршрутов (лента билдов, случайный герой, логин, регистрация).
- `VerifiedGuard` — поверх `JwtAuthGuard`, вешается на `POST /builds` и `POST /comments`. Голосовать («Нравится / Ситуативно / Не нравится») можно и без подтверждённой почты.
- `RolesGuard` + `@Roles(UserRole.ADMIN)` — под будущую модерацию.
- `@CurrentUser()` — достаёт payload из запроса.
- `TurnstileGuard` — свой guard: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` с секретом и `remoteip`. Пакет `@nestlab/google-recaptcha` из зависимостей удаляем.
- `@nestjs/throttler` на все `/auth/*`: логин 5 попыток в минуту на IP, письма (верификация и сброс) — 3 в час на адрес.

## Что удаляем

- `session(...)`, `RedisStore` и `cookieParser` из `apps/backend/src/main.ts`.
- Файл `apps/backend/src/express-session.d.ts`.
- Зависимости `express-session`, `connect-redis`, `cookie-parser`, `@types/express-session`, `@types/cookie-parser`, `@nestlab/google-recaptcha`.
- Переменные `SESSION_*` и `COOKIES_SECRET` из `.env` и `.env.example`.
- Заглушку `saveSession()` из `AuthService`.
- В CORS убираем `credentials: true` и `exposedHeaders: ['set-cookie']` — кук больше нет.

## Новые зависимости

`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-google-oauth20` (+ типы), `@nestjs/throttler`. `argon2`, `ioredis` и `@nestjs-modules/mailer` уже стоят.

## Переменные окружения

```
JWT_ACCESS_SECRET=
JWT_ACCESS_TTL='15m'
JWT_REFRESH_TTL='30d'
REFRESH_PREFIX='refresh:'

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL='${APPLICATION_URL}/auth/google/callback'

TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=
```

Секреты — только в `.env`, в `.env.example` пустые заглушки.

## Фронтенд

- Страница логина по макету: Google, разделитель «или», поля почты и пароля с переключателем видимости, «Забыли пароль?», кнопка входа, ссылка на регистрацию. Кнопки Apple и SSO не рендерим.
- Отдельные страницы: регистрация, подтверждение почты (`/auth/verify`), запрос и установка нового пароля (`/auth/password-reset`), возврат от Google (`/auth/callback`).
- Обёртка над `fetch` (`_lib/auth-api.ts`): подставляет `Authorization`, при 401 один раз дёргает `/auth/refresh` и повторяет запрос; параллельные обновления складываются в один общий полёт, иначе второй запрос пришёл бы с уже погашенным токеном и убил бы всю семью.
- Access — в памяти, refresh — в `localStorage`, восстановление сессии при загрузке страницы через `/auth/refresh`.
- Состояние сессии живёт во внешнем сторе (`_lib/auth-store.ts` + хук `_hooks/use-auth.ts` на `useSyncExternalStore`), а не в React-контексте: страницы рендерятся как RSC, и провайдер из layout до их клиентских поддеревьев не дотягивается.
- Строгий CSP в конфиге Worker: `localStorage` с refresh-токеном оправдан только при закрытом XSS. **Пока не сделано.**
- UI-состояния: неподтверждённая почта → баннер «Подтвердите почту, чтобы публиковать билды». **Пока не сделано:** сервер уже отвечает 403, но отдельного баннера в ленте нет.

## Локальное окружение

`npm run db:up` поднимает Postgres, Redis и Mailpit. Письма видно на http://localhost:8025, SMTP слушает 1025 — почтовые сценарии проверяются без внешнего провайдера.

## Порядок работ

1. Схема Prisma и миграция: nullable-пароль, чистка enum'ов, связь билдов с пользователем.
2. Вычистить `express-session` и cookie-инфраструктуру, обновить `.env.example`.
3. `TokenService` на Redis: выпуск пары, хранение хешей, ротация, отзыв семьи, logout-all.
4. `AuthService` + `AuthController`: регистрация, логин, refresh, logout.
5. `JwtStrategy`, `JwtAuthGuard`, `@Public()`, `@CurrentUser()`, `VerifiedGuard`, `RolesGuard`.
6. Turnstile-guard и throttler.
7. Почта: верификация и сброс пароля на `@nestjs-modules/mailer` + React Email.
8. Google OAuth: стратегия, связывание с существующим email-аккаунтом.
9. Закрыть `POST /builds` и `POST /comments`, привязать авторство к пользователю.
10. Фронтенд: страницы, fetch-обёртка, состояние сессии.
11. Тесты: юнит на ротацию и детект переиспользования, e2e на регистрацию → верификацию → логин → refresh → logout, тест на 401 после отзыва.

## Что осталось

- Строгий CSP в Worker — обязателен, раз refresh лежит в `localStorage`.
- Баннер «подтвердите почту» и блокировка формы публикации на клиенте.
- Модели комментариев и голосов в базе: сейчас есть только DTO, поэтому закрывать под `VerifiedGuard` пока нечего.
- Turnstile-виджет на формах (бэкенд готов, `TURNSTILE_ENABLED=false` до появления ключей).

## Открытые вопросы

- Нужен ли rate limit по конкретному аккаунту (а не только по IP) при переборе пароля.
- Нужна ли страница «активные сессии» с возможностью отозвать отдельное устройство — данные в Redis для этого уже есть.
