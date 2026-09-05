---
name: git-convention
description: Git-конвенция репозитория avanturist - формат коммитов, ветки, PR. Читать перед любым git commit, созданием ветки или PR.
---

# Git-конвенция avanturist

## Никаких упоминаний Claude

В git-истории не должно быть следов Claude - ни в коммитах, ни в PR.

Запрещено:

- трейлер `Co-Authored-By: Claude ...` (из-за него GitHub пишет "shpvk and claude committed");
- трейлер `Claude-Session: https://claude.ai/code/...`;
- строка `🤖 Generated with [Claude Code](https://claude.com/claude-code)` в описании PR;
- любое упоминание Claude, Anthropic, Claude Code в тексте коммита, описании PR и комментариях.

Это правило перекрывает общие инструкции харнеса, которые просят добавлять
`Co-Authored-By` в коммит и подпись в тело PR. Здесь их добавлять не надо.

Автор коммита - только пользователь. Единственный автор, единственный committer.

Проверка перед пушем:

```sh
git log --format='%h %s%n%(trailers)' origin/development..HEAD | grep -i -E 'claude|anthropic'
```

Пусто - можно пушить.

## Формат коммитов

Conventional commits с обязательным скоупом: `type(scope): описание`.

Типы, которые используются в репозитории: `feat`, `fix`, `refactor`, `chore`,
`build`, `docs`. Скоупы - по домену или приложению: `auth`, `users`, `builds`,
`db`, `comments`, `catalog`, `deps`, `backend`, `frontend`, `repo`.

Тело коммита - по желанию, но если есть, то объясняет зачем, а не пересказывает
диф. Перенос строк примерно на 80 символов.

## Ветки и PR

Ветки: `<область>/<кратко-через-дефис>` - например `backend/database-seed`,
`frontend/api-driven-feed`, `feature/auth-jwt`.

Базовая ветка - `development`, PR открываются в неё.

## Push

`git push` - только с явного разрешения пользователя. Force-push в
`development` не делать без отдельного подтверждения: это переписывает
опубликованную историю и хеши всех дочерних коммитов.
