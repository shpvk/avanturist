"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import HeroModelViewer from "./hero-model-viewer";

type View = "random" | "all";
type Vote = "positive" | "situational" | "negative";
type Theme = "dark" | "light";
type FeedSort = "new" | "popular";
type RoleClass = "carry" | "offlane" | "support" | "mid";
type RoleFilter = "all" | RoleClass;

type AuthUser = {
  name: string;
  email: string;
};

type BuildComment = {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
};

type Build = {
  id: string;
  hero: string;
  heroImage: string;
  title: string;
  role: string;
  roleClass: RoleClass;
  items: string[];
  author: string;
  avatar: string;
  reputation: string;
  verdict: string;
  verdictType: string;
  votes: [number, number, number];
  comments: BuildComment[];
  date: string;
  dateTime: string;
};

const initialBuilds: Build[] = [
  {
    id: "anti-mage-mana-pressure", hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", title: "Антимаг без антимагии",
    role: "Керри", roleClass: "carry",
    items: ["bloodstone", "kaya", "yasha_and_kaya", "arcane_blink", "butterfly", "moon_shard"],
    author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", reputation: "1 245",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [82, 12, 6], date: "20 мая 2024", dateTime: "2024-05-20",
    comments: [
      { id: "am-c1", author: "MidOrFeed", avatar: "/assets/heroes/leshrac.png", date: "20 мая", text: "Каю на антимаге не воспринимал всерьёз, но с бладстоуном мана правда не кончается. В затяжных играх работает." },
      { id: "am-c2", author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", date: "21 мая", text: "Против керри с чистым уроном разваливается моментально. Только если враг весь физический." },
      { id: "am-c3", author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", date: "22 мая", text: "Муншард последним предметом — обязателен, иначе дпс проседает после 35 минуты." },
    ],
  },
  {
    id: "phantom-assassin-critical", hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", title: "Броня вместо уклонения",
    role: "Керри", roleClass: "carry",
    items: ["blade_mail", "heart", "bloodstone", "pipe", "overwhelming_blink", "lotus_orb"],
    author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", reputation: "980",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [76, 16, 8], date: "19 мая 2024", dateTime: "2024-05-19",
    comments: [
      { id: "pa-c1", author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", date: "19 мая", text: "Танковая ФА звучит как троллинг, но блейдмейл с блюром реально возвращает половину урона. Забавно работает." },
      { id: "pa-c2", author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", date: "20 мая", text: "Не хватает хотя бы одного предмета на урон, иначе крит нечем реализовывать." },
    ],
  },
  {
    id: "pudge-tank", hero: "Pudge", heroImage: "/assets/heroes/pudge.png", title: "Пудж через скорость атаки",
    role: "Оффлейн", roleClass: "offlane",
    items: ["manta", "butterfly", "moon_shard", "daedalus", "satanic", "overwhelming_blink"],
    author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", reputation: "2 310",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [69, 20, 11], date: "18 мая 2024", dateTime: "2024-05-18",
    comments: [
      { id: "pudge-c1", author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", date: "18 мая", text: "Манта на пудже — это чистое веселье, иллюзии тянут крипов, пока ты ищешь крюк." },
      { id: "pudge-c2", author: "MidOrFeed", avatar: "/assets/heroes/leshrac.png", date: "19 мая", text: "Сатаник обязателен, иначе умираешь раньше, чем успеваешь докрутить скорость атаки." },
      { id: "pudge-c3", author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", date: "19 мая", text: "Сыграл три катки — два раза сработало, один раз кормил всю игру. Ситуативно." },
    ],
  },
  {
    id: "shadow-shaman-push", hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", title: "Шаман с руки",
    role: "Саппорт", roleClass: "support",
    items: ["mask_of_madness", "desolator", "manta", "butterfly", "daedalus", "arcane_blink"],
    author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", reputation: "760",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [74, 18, 8], date: "17 мая 2024", dateTime: "2024-05-17",
    comments: [
      { id: "ss-c1", author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", date: "17 мая", text: "Шаман с руки выглядит абсурдно, но маска безумия и десолятор превращают его в керри на 20 минуте." },
      { id: "ss-c2", author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", date: "18 мая", text: "Нужен второй саппорт в команде, иначе вардов на карте не будет вообще." },
    ],
  },
  {
    id: "leshrac-zones", hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", title: "Физический Лешрак",
    role: "Мид", roleClass: "mid",
    items: ["shadow_blade", "daedalus", "butterfly", "moon_shard", "satanic", "overwhelming_blink"],
    author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", reputation: "1 530",
    verdict: "Нейтрально", verdictType: "neutral", votes: [46, 34, 20], date: "16 мая 2024", dateTime: "2024-05-16",
    comments: [
      { id: "lesh-c1", author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", date: "16 мая", text: "Физический Лешрак работает только пока враги не купили армор. Дальше — боль." },
      { id: "lesh-c2", author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", date: "17 мая", text: "Шэдоу блейд для инициации — топ, но бабочку я бы поменял на что-то с уроном." },
    ],
  },
];

const heroOptions: Array<{ hero: string; heroImage: string; role: string; roleClass: RoleClass }> = [
  { hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", role: "Керри", roleClass: "carry" },
  { hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", role: "Керри", roleClass: "carry" },
  { hero: "Pudge", heroImage: "/assets/heroes/pudge.png", role: "Оффлейн", roleClass: "offlane" },
  { hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", role: "Саппорт", roleClass: "support" },
  { hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", role: "Мид", roleClass: "mid" },
];

const itemOptions = Array.from(new Set(initialBuilds.flatMap((build) => build.items)));

const itemNames: Record<string, string> = {
  aether_lens: "Aether Lens",
  arcane_blink: "Arcane Blink",
  bfury: "Battle Fury",
  blade_mail: "Blade Mail",
  bloodstone: "Bloodstone",
  butterfly: "Butterfly",
  daedalus: "Daedalus",
  desolator: "Desolator",
  heart: "Heart of Tarrasque",
  kaya: "Kaya",
  lotus_orb: "Lotus Orb",
  manta: "Manta Style",
  mask_of_madness: "Mask of Madness",
  monkey_king_bar: "Monkey King Bar",
  moon_shard: "Moon Shard",
  overwhelming_blink: "Overwhelming Blink",
  pipe: "Pipe of Insight",
  power_treads: "Power Treads",
  ring_of_health: "Ring of Health",
  satanic: "Satanic",
  shadow_blade: "Shadow Blade",
  skadi: "Eye of Skadi",
  yasha_and_kaya: "Yasha and Kaya",
};

const roleOptions: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "Все позиции" },
  { value: "carry", label: "Керри" },
  { value: "mid", label: "Мид" },
  { value: "offlane", label: "Оффлейн" },
  { value: "support", label: "Саппорт" },
];

function itemLabel(item: string) {
  return itemNames[item] ?? item.replaceAll("_", " ");
}

function reputationValue(reputation: string) {
  return Number(reputation.replaceAll(/\D/g, "")) || 0;
}

function commentsLabel(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  const word = lastTwoDigits >= 11 && lastTwoDigits <= 14 ? "комментариев" : lastDigit === 1 ? "комментарий" : lastDigit >= 2 && lastDigit <= 4 ? "комментария" : "комментариев";
  return `${count} ${word}`;
}

const collapsedCommentCount = 2;

const voteOptions: Array<{ value: Vote; icon: string; label: string; hint: string }> = [
  { value: "positive", icon: "👍", label: "Лайк", hint: "Билд хороший" },
  { value: "situational", icon: "◐", label: "Ситуативно", hint: "Подойдёт не всегда" },
  { value: "negative", icon: "👎", label: "Дизлайк", hint: "Билд не работает" },
];

function ItemIcons({ items, inventory = false }: { items: string[]; inventory?: boolean }) {
  return (
    <div className={`item-row${inventory ? " inventory" : ""}`} aria-label="Предметы сборки">
      {items.map((item) => (
        <Image
          key={item}
          src={`/assets/items/${item}.png`}
          alt={itemLabel(item)}
          title={itemLabel(item)}
          width={88}
          height={64}
          loading="lazy"
          unoptimized
        />
      ))}
    </div>
  );
}

function Author({ build }: { build: Build }) {
  return (
    <div className="author-row">
      <Image src={build.avatar} alt="" width={42} height={42} loading="lazy" unoptimized />
      <div><strong>{build.author}</strong><span>Репутация: {build.reputation} <b>▲</b></span></div>
    </div>
  );
}

function BuildCard({ build, index, onOpen }: { build: Build; index: number; onOpen: () => void }) {
  return (
    <article className="build-card">
      <div className="hero-section">
        <Image className="hero-image" src={build.heroImage} alt={build.hero} width={256} height={144} loading={index === 0 ? "eager" : "lazy"} unoptimized />
        <div className="hero-copy"><h2>{build.hero}</h2><button className="build-title" type="button" onClick={onOpen} aria-label={`Открыть билд «${build.title}»`}>{build.title}</button><div className="hero-meta"><span className={`role-badge ${build.roleClass}`}>{build.role}</span></div></div>
      </div>
      <div className="items-section">
        <h3>Предметы</h3><ItemIcons items={build.items} />
      </div>
      <div className="author-section">
        <Author build={build} />
        <div className="verdict-block"><span>Вердикт</span><strong className={`verdict ${build.verdictType}`}>{build.verdict}</strong></div>
      </div>
      <div className="votes-section">
        <span>Распределение голосов</span><div className="vote-bar" role="img" aria-label={`Лайк ${build.votes[0]}%, ситуативно ${build.votes[1]}%, дизлайк ${build.votes[2]}%`}><i className="positive" style={{ width: `${build.votes[0]}%` }} /><i className="uncertain" style={{ width: `${build.votes[1]}%` }} /><i className="negative" style={{ width: `${build.votes[2]}%` }} /></div><div className="vote-values" aria-hidden="true"><b>{build.votes[0]}%</b><b>{build.votes[1]}%</b><b>{build.votes[2]}%</b></div>
      </div>
      <div className="card-meta">
        <div className="card-meta-copy"><span className="comments" aria-label={commentsLabel(build.comments.length)}><i aria-hidden="true">•••</i><span aria-hidden="true">{build.comments.length}</span></span><time dateTime={build.dateTime}>{build.date}</time></div>
        <button className="card-open-button" type="button" onClick={onOpen}>Открыть билд <span aria-hidden="true">→</span></button>
      </div>
    </article>
  );
}

function Header({ view, theme, user, onViewChange, onThemeToggle, onAddBuild }: { view: View; theme: Theme; user: AuthUser | null; onViewChange: (view: View) => void; onThemeToggle: () => void; onAddBuild: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <nav className="header-nav" aria-label="Основные разделы">
          <button className={view === "random" ? "active" : ""} type="button" aria-pressed={view === "random"} onClick={() => onViewChange("random")}>Случайный билд</button>
          <button className={view === "all" ? "active" : ""} type="button" aria-pressed={view === "all"} onClick={() => onViewChange("all")}>Все билды</button>
        </nav>
        <button
          className={`theme-toggle ${theme}`}
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          suppressHydrationWarning
        >
          <span className="theme-icon" aria-hidden="true" />
        </button>
        <div className="header-actions">
          <button className="primary-button" type="button" onClick={onAddBuild}>Добавить билд</button>
          {user ? (
            <a className="account-button" href="/signout-with-chatgpt?return_to=%2F" aria-label={`Выйти из аккаунта ${user.name}`}>
              <span className="account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="account-copy"><strong>{user.name}</strong><small>Выйти</small></span>
            </a>
          ) : (
            <a className="login-button" href="/signin-with-chatgpt?return_to=%2F"><span className="person-icon" aria-hidden="true" />Войти</a>
          )}
        </div>
      </div>
    </header>
  );
}

function RandomBuild({ build, vote, onVote, onNext }: { build: Build; vote: Vote | null; onVote: (vote: Vote) => void; onNext: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [localComments, setLocalComments] = useState<Record<string, BuildComment[]>>({});
  // Tracked by build id instead of a boolean so switching builds collapses again.
  const [expandedBuildId, setExpandedBuildId] = useState<string | null>(null);
  const displayedVotes = useMemo(() => {
    if (!vote) return build.votes;
    const values = [...build.votes] as [number, number, number];
    values[vote === "positive" ? 0 : vote === "situational" ? 1 : 2] += 1;
    const total = values.reduce((sum, value) => sum + value, 0);
    return values.map((value) => Math.round((value / total) * 100)) as [number, number, number];
  }, [build, vote]);
  const heroAssetName = build.heroImage.split("/").at(-1)?.replace(/\.png$/, "") ?? "antimage";
  const buildComments = [...build.comments, ...(localComments[build.id] ?? [])];
  // Collapsed the list stops at two entries, which keeps the composer fully in view.
  const isCommentsExpanded = expandedBuildId === build.id;
  const visibleComments = isCommentsExpanded ? buildComments : buildComments.slice(0, collapsedCommentCount);
  const hiddenCommentCount = buildComments.length - visibleComments.length;
  // Drafts are kept per build so switching builds shows that build's own unsent text.
  const commentDraft = drafts[build.id] ?? "";
  const setCommentDraft = (value: string) => setDrafts((current) => ({ ...current, [build.id]: value }));

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;
    setLocalComments((current) => ({
      ...current,
      [build.id]: [
        ...(current[build.id] ?? []),
        { id: `${build.id}-${Date.now()}`, author: "Вы", avatar: "/assets/heroes/community-avatar.webp", date: "только что", text },
      ],
    }));
    setCommentDraft("");
  };

  // A vote counts immediately and hands the reader the next build — no confirmation step.
  const handleVote = (value: Vote) => {
    onVote(value);
    onNext();
  };

  return (
    <main className="random-main">
      <h1 className="sr-only">Случайный билд: {build.hero} — {build.title}</h1>

      <article className="random-card dota-stage">
        <div className="dota-build-panel">
          <div className="dota-panel-header">
            <div className="dota-hero-identity">
              <Image src={build.heroImage} alt="" width={256} height={144} unoptimized />
              <div><span className={`role-badge ${build.roleClass}`}>{build.role}</span><h2>{build.hero}</h2></div>
            </div>
            <div className="dota-panel-meta">
              <div className="dota-panel-author">
                <Author build={build} />
                <time className="random-build-date" dateTime={build.dateTime}>{build.date}</time>
              </div>
              <button className="shuffle-button" type="button" onClick={onNext}><span aria-hidden="true">↻</span> Другой билд</button>
            </div>
          </div>
          <h3 className="dota-build-title">{build.title}</h3>
          <div className="dota-inventory"><span className="section-label">Предметы</span><ItemIcons items={build.items} inventory /></div>
          <section className="build-comments" aria-label="Комментарии к билду">
            <div className="build-comments-head">
              <span className="section-label">Комментарии</span>
              <div className="build-comments-tools">
                <span className="random-comment-count"><i aria-hidden="true">•••</i>{commentsLabel(buildComments.length)}</span>
                {buildComments.length > collapsedCommentCount && (
                  <button
                    className="comments-toggle"
                    type="button"
                    aria-expanded={isCommentsExpanded}
                    aria-controls={`comment-list-${build.id}`}
                    onClick={() => setExpandedBuildId(isCommentsExpanded ? null : build.id)}
                  >
                    {isCommentsExpanded ? "Свернуть" : `Показать все (${buildComments.length})`}
                    <span aria-hidden="true">{isCommentsExpanded ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>
            </div>
            <ol id={`comment-list-${build.id}`} className="comment-list" aria-live="polite">
              {visibleComments.map((comment) => (
                <li className="comment-item" key={comment.id}>
                  <Image src={comment.avatar} alt="" width={36} height={36} loading="lazy" unoptimized />
                  <div>
                    <div className="comment-item-head"><strong>{comment.author}</strong><span>{comment.date}</span></div>
                    <p>{comment.text}</p>
                  </div>
                </li>
              ))}
              {buildComments.length === 0 && <li className="comment-empty">Комментариев пока нет — напишите первый.</li>}
            </ol>
            {hiddenCommentCount > 0 && (
              <button className="comments-more" type="button" onClick={() => setExpandedBuildId(build.id)}>
                Ещё {commentsLabel(hiddenCommentCount)}
              </button>
            )}
            <form className="comment-composer" onSubmit={handleCommentSubmit}>
              <label className="sr-only" htmlFor={`comment-${build.id}`}>Комментарий к билду</label>
              <textarea id={`comment-${build.id}`} value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={500} rows={2} placeholder="Что думаете об этой сборке?" />
              <div className="comment-composer-footer"><span>{commentDraft.length}/500</span><button type="submit" disabled={!commentDraft.trim()}>Отправить</button></div>
            </form>
          </section>
        </div>

        <div className="hero-showcase">
          <div className="hero-aura" aria-hidden="true" />
          <HeroModelViewer key={heroAssetName} hero={build.hero} slug={heroAssetName} />
        </div>

        <aside className="rating-panel">
          <div className="rating-actions">
            {voteOptions.map((option) => (
              <button key={option.value} className={`rating-button ${option.value}${vote === option.value ? " selected" : ""}`} type="button" aria-pressed={vote === option.value} onClick={() => handleVote(option.value)}>
                <span className="rating-icon" aria-hidden="true">{option.icon}</span><span><strong>{option.label}</strong><small>{option.hint}</small></span>
              </button>
            ))}
          </div>
          <div className="random-results" aria-live="polite">
            <div><span>Мнение сообщества</span><strong>{displayedVotes[0] + displayedVotes[1]}% считают билд полезным</strong></div>
            <div className="vote-bar" role="img" aria-label={`Лайк ${displayedVotes[0]}%, ситуативно ${displayedVotes[1]}%, дизлайк ${displayedVotes[2]}%`}><i className="positive" style={{ width: `${displayedVotes[0]}%` }} /><i className="uncertain" style={{ width: `${displayedVotes[1]}%` }} /><i className="negative" style={{ width: `${displayedVotes[2]}%` }} /></div>
            <div className="vote-values" aria-hidden="true">
              {displayedVotes.map((value, index) => <b key={index} style={{ flexBasis: `${value}%` }}>{value}%</b>)}
            </div>
          </div>
          <button className="next-build-button" type="button" onClick={onNext}>Следующий билд <span aria-hidden="true">→</span></button>
        </aside>
      </article>
    </main>
  );
}

function useDialogA11y(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableElements = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => !element.hasAttribute("hidden"));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = elements[0];
      const last = elements.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => (focusableElements()[0] ?? dialog)?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return dialogRef;
}

function AddBuildDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (build: Build) => void }) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const dialogRef = useDialogA11y(onClose);

  const toggleItem = (item: string) => {
    setSelectedItems((current) => current.includes(item) ? current.filter((value) => value !== item) : current.length < 6 ? [...current, item] : current);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedHero = heroOptions.find((option) => option.hero === formData.get("hero"));
    if (!selectedHero || selectedItems.length === 0) return;

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    onSubmit({
      id: `local-${Date.now()}`,
      ...selectedHero,
      title,
      items: selectedItems,
      author: "Вы",
      avatar: "/assets/heroes/community-avatar.webp",
      reputation: "0",
      verdict: "Нет оценок",
      verdictType: "neutral",
      votes: [0, 0, 0],
      comments: [],
      date: "сегодня",
      dateTime: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="add-build-dialog" role="dialog" aria-modal="true" aria-labelledby="add-build-title" aria-describedby="add-build-description" tabIndex={-1}>
        <div className="dialog-heading"><div><span className="eyebrow">Новая сборка</span><h2 id="add-build-title">Добавить билд</h2><p id="add-build-description">Придумайте название и выберите предметы.</p></div><button type="button" onClick={onClose} aria-label="Закрыть форму">×</button></div>
        <form onSubmit={handleSubmit}>
          <label className="form-field"><span>Герой</span><select name="hero" defaultValue={heroOptions[0].hero} required>{heroOptions.map((option) => <option key={option.hero}>{option.hero}</option>)}</select></label>
          <label className="form-field"><span>Название</span><input name="title" type="text" minLength={2} maxLength={80} placeholder="Придумайте название сборки" required /></label>
          <fieldset className="item-picker"><legend>Предметы <small>от 1 до 6</small></legend><div>{itemOptions.map((item) => {
            const selected = selectedItems.includes(item);
            const limitReached = selectedItems.length >= 6 && !selected;
            return <button key={item} className={selected ? "selected" : ""} type="button" onClick={() => toggleItem(item)} aria-pressed={selected} aria-label={`${selected ? "Убрать" : "Выбрать"} предмет ${itemLabel(item)}`} disabled={limitReached}><Image src={`/assets/items/${item}.png`} alt="" width={88} height={64} unoptimized /></button>;
          })}</div></fieldset>
          <div className="dialog-actions"><span>{selectedItems.length}/6 предметов</span><button className="cancel-button" type="button" onClick={onClose}>Отмена</button><button className="submit-build-button" type="submit" disabled={selectedItems.length === 0}>Добавить билд</button></div>
        </form>
      </section>
    </div>
  );
}

function AllBuilds({ builds, heroSearch, onHeroSearchChange, onOpenBuild }: { builds: Build[]; heroSearch: string; onHeroSearchChange: (value: string) => void; onOpenBuild: (id: string) => void }) {
  const [feedSort, setFeedSort] = useState<FeedSort>("new");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const normalizedHeroSearch = heroSearch.trim().toLocaleLowerCase("ru-RU");
  const filteredBuilds = builds.filter((build) => {
    const searchableText = `${build.hero} ${build.title} ${build.author}`.toLocaleLowerCase("ru-RU");
    const matchesSearch = !normalizedHeroSearch || searchableText.includes(normalizedHeroSearch);
    const matchesRole = roleFilter === "all" || build.roleClass === roleFilter;
    return matchesSearch && matchesRole;
  });
  const displayedBuilds = feedSort === "popular"
    ? [...filteredBuilds].sort((first, second) => second.votes[0] - first.votes[0] || reputationValue(second.reputation) - reputationValue(first.reputation))
    : filteredBuilds;
  const hasActiveFilters = normalizedHeroSearch.length > 0 || roleFilter !== "all" || feedSort !== "new";

  const resetFilters = () => {
    onHeroSearchChange("");
    setRoleFilter("all");
    setFeedSort("new");
  };

  return (
    <main className="main-content all-builds-main">
      <div className="all-builds-heading"><div><h1>Все билды</h1><p>Экспериментальные сборки сообщества для всех ролей.</p></div><div className="feed-tabs" role="group" aria-label="Порядок билдов"><button className={feedSort === "new" ? "active" : ""} type="button" aria-pressed={feedSort === "new"} onClick={() => setFeedSort("new")}>Новые</button><button className={feedSort === "popular" ? "active" : ""} type="button" aria-pressed={feedSort === "popular"} onClick={() => setFeedSort("popular")}>Популярные</button></div></div>
      <section className="filters" aria-label="Фильтры билдов">
        <label className="search-field feed-search"><span className="sr-only">Поиск героя или билда</span><span className="search-icon" aria-hidden="true" /><input type="search" value={heroSearch} onChange={(event) => onHeroSearchChange(event.target.value)} placeholder="Герой или билд..." autoComplete="off" /></label>
        <label className="filter-field"><span>Позиция</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <p className="result-count" role="status"><strong>{displayedBuilds.length}</strong> из {builds.length} билдов</p>
        <button className="reset-button" type="button" onClick={resetFilters} disabled={!hasActiveFilters}><span aria-hidden="true">↻</span>Сбросить фильтры</button>
      </section>
      <section className="build-list" aria-label="Список билдов">
        {displayedBuilds.map((build, index) => <BuildCard build={build} index={index} key={build.id} onOpen={() => onOpenBuild(build.id)} />)}
        {displayedBuilds.length === 0 && <p className="empty-builds">Билдов с такими фильтрами пока нет. Попробуйте изменить запрос.</p>}
      </section>
    </main>
  );
}

export default function BuildVerdictClient({ initialUser = null }: { initialUser?: AuthUser | null }) {
  const [builds, setBuilds] = useState<Build[]>(initialBuilds);
  const [view, setView] = useState<View>("random");
  const [randomIndex, setRandomIndex] = useState(0);
  const [vote, setVote] = useState<Vote | null>(null);
  const [theme, setTheme] = useState<Theme>(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const [isAddBuildOpen, setIsAddBuildOpen] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");

  const showNextBuild = () => {
    setRandomIndex((current) => (current + 1 + Math.floor(Math.random() * (builds.length - 1))) % builds.length);
    setVote(null);
  };

  const addBuild = (build: Build) => {
    setBuilds((current) => [build, ...current]);
    setRandomIndex(0);
    setVote(null);
    setView("all");
    setIsAddBuildOpen(false);
  };

  const openBuild = (id: string) => {
    const index = builds.findIndex((build) => build.id === id);
    if (index < 0) return;
    setRandomIndex(index);
    setVote(null);
    setView("random");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem("buildverdict-theme", next);
      } catch {
        // The switch still works for the current session without storage.
      }
      return next;
    });
  };

  return (
    <div className="site-shell">
      <Header view={view} theme={theme} user={initialUser} onViewChange={setView} onThemeToggle={toggleTheme} onAddBuild={() => setIsAddBuildOpen(true)} />
      {view === "random" ? <RandomBuild build={builds[randomIndex]} vote={vote} onVote={setVote} onNext={showNextBuild} /> : <AllBuilds builds={builds} heroSearch={heroSearch} onHeroSearchChange={setHeroSearch} onOpenBuild={openBuild} />}
      {isAddBuildOpen && <AddBuildDialog onClose={() => setIsAddBuildOpen(false)} onSubmit={addBuild} />}
    </div>
  );
}
