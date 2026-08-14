import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BuildVerdict — билды Dota 2",
  description: "Оценивайте и обсуждайте билды героев Dota 2.",
};

const builds = [
  {
    hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", title: "Мана-бритва: давление без пауз",
    role: "Керри", roleClass: "carry", rating: "3000–7000",
    items: ["bfury", "power_treads", "butterfly", "heart", "manta", "moon_shard"],
    description: "Максимизируем фарм и давление на карту через ману и мобильность. Постоянный сплит и контроль рун.",
    author: "SilentStep", avatar: "/assets/heroes/community-avatar.jpg", reputation: "1 245",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [82, 12, 6], comments: 56, date: "20 мая 2024",
  },
  {
    hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", title: "Критический момент",
    role: "Керри", roleClass: "carry", rating: "2000–6000",
    items: ["daedalus", "power_treads", "mask_of_madness", "shadow_blade", "butterfly", "desolator"],
    description: "Выходим в крит как можно раньше и ищем цели по одной. Ставим вижн, играем от передвижения.",
    author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", reputation: "980",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [76, 16, 8], comments: 34, date: "19 мая 2024",
  },
  {
    hero: "Pudge", heroImage: "/assets/heroes/pudge.png", title: "Танк-инициатор через мясо",
    role: "Оффлейн", roleClass: "offlane", rating: "1000–5000",
    items: ["ring_of_health", "power_treads", "bloodstone", "shadow_blade", "blade_mail", "pipe"],
    description: "Впитываем урон, находим крюки и открываем файты. Команда следует за нами — враг разделён.",
    author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", reputation: "2 310",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [69, 20, 11], comments: 41, date: "18 мая 2024",
  },
  {
    hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", title: "Контроль и пуш по таймингам",
    role: "Саппорт", roleClass: "support", rating: "1500–5500",
    items: ["aether_lens", "power_treads", "arcane_blink", "lotus_orb", "butterfly", "overwhelming_blink"],
    description: "Ранний контроль, установка тотемов и быстрый пуш вышек. Двигаем линию — выигрываем карту.",
    author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", reputation: "760",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [74, 18, 8], comments: 27, date: "17 мая 2024",
  },
  {
    hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", title: "Постоянный урон и зоны",
    role: "Мид", roleClass: "mid", rating: "2500–6500",
    items: ["moon_shard", "power_treads", "kaya", "bloodstone", "pipe", "yasha_and_kaya"],
    description: "Давим с заклинаний, ставим зоны и забираем цели на дистанции. Отлично против плотных драфтов.",
    author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", reputation: "1 530",
    verdict: "Нейтрально", verdictType: "neutral", votes: [46, 34, 20], comments: 38, date: "16 мая 2024",
  },
];

export default function Home() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <label className="search-field">
            <span className="sr-only">Поиск билдов и героев</span>
            <span className="search-icon" aria-hidden="true" />
            <input type="search" placeholder="Поиск билдов и героев..." />
          </label>
          <div className="header-actions">
            <button className="primary-button" type="button">Добавить билд</button>
            <button className="login-button" type="button"><span className="person-icon" aria-hidden="true" />Войти</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <nav className="tabs" aria-label="Сортировка ленты">
          <button className="tab active" type="button">Новые</button>
          <button className="tab" type="button">Популярные</button>
        </nav>

        <section className="filters" aria-label="Фильтры билдов">
          <label className="filter-field"><span>Герой</span><select defaultValue="all"><option value="all">Все герои</option><option>Anti-Mage</option><option>Phantom Assassin</option><option>Pudge</option></select></label>
          <label className="filter-field"><span>Позиция</span><select defaultValue="all"><option value="all">Все позиции</option><option>Керри</option><option>Мид</option><option>Оффлейн</option><option>Саппорт</option></select></label>
          <div className="filter-field rating-filter"><span>Рейтинг</span><div className="rating-controls"><select aria-label="Минимальный рейтинг" defaultValue="0"><option>0</option><option>1000</option><option>2000</option></select><span className="rating-dash">—</span><select aria-label="Максимальный рейтинг" defaultValue="8000+"><option>8000+</option><option>6000</option><option>4000</option></select></div></div>
          <button className="reset-button" type="button"><span aria-hidden="true">↻</span>Сбросить фильтры</button>
          <label className="sort-field"><span className="sort-icon" aria-hidden="true">↕</span><select aria-label="Сортировка" defaultValue="new"><option value="new">Сначала новые</option><option value="popular">Сначала популярные</option></select></label>
        </section>

        <section className="build-list" aria-label="Список билдов">
          {builds.map((build) => (
            <article className="build-card" key={build.hero}>
              <div className="hero-section">
                <img className="hero-image" src={build.heroImage} alt={build.hero} />
                <div className="hero-copy"><h2>{build.hero}</h2><button className="build-title" type="button">{build.title}</button><div className="hero-meta"><span className={`role-badge ${build.roleClass}`}>{build.role}</span><span>Рейтинг: {build.rating}</span></div></div>
              </div>
              <div className="items-section">
                <h3>Предметы</h3><div className="item-row">{build.items.map((item) => <img key={item} src={`/assets/items/${item}.png`} alt="" />)}</div><p>{build.description}</p>
              </div>
              <div className="author-section">
                <div className="author-row"><img src={build.avatar} alt="" /><div><strong>{build.author}</strong><span>Репутация: {build.reputation} <b>▲</b></span></div></div>
                <div className="verdict-block"><span>Вердикт</span><strong className={`verdict ${build.verdictType}`}>{build.verdict}</strong></div>
              </div>
              <div className="votes-section">
                <span>Распределение голосов</span><div className="vote-bar" aria-label={`Голоса: ${build.votes.join(", ")} процентов`}><i className="positive" style={{ width: `${build.votes[0]}%` }} /><i className="uncertain" style={{ width: `${build.votes[1]}%` }} /><i className="negative" style={{ width: `${build.votes[2]}%` }} /></div><div className="vote-values"><b>{build.votes[0]}%</b><b>{build.votes[1]}%</b><b>{build.votes[2]}%</b></div>
              </div>
              <div className="card-meta"><span className="comments"><i aria-hidden="true">•••</i>{build.comments}</span><time>{build.date}</time></div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
