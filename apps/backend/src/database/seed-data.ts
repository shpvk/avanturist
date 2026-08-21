import { Verdict } from '../votes/verdict.enum';

type SeedVote = { voterKey: string; verdict: Verdict; hoursAfter: number };
type SeedComment = { author: string; text: string; hoursAfter: number };

export type SeedBuild = {
    title: string;
    heroId: string;
    items: string[];
    author: string;
    daysAgo: number;
    votes: SeedVote[];
    comments: SeedComment[];
};

/** Постоянные посетители: один и тот же ключ голосует по разным сборкам. */
const voters = {
    midOrFeed: 'guest-7f2a19',
    totemPower: 'guest-c41b08',
    silentStep: 'guest-93de5a',
    kotenok: 'guest-2b7704',
    veinHunter: 'guest-e15c33',
    charge: 'guest-4a0f6d',
    neonWaltz: 'guest-8d92b1',
    lateGameOnly: 'guest-51cc7e',
};

/**
 * Предметы берутся только из набора с иконками в apps/frontend/public/assets/items,
 * иначе карточка сборки покажет битые картинки.
 */
export const seedBuilds: SeedBuild[] = [
    {
        title: 'Пудж, который заходит из инвиза',
        heroId: 'pudge',
        items: ['power_treads', 'shadow_blade', 'blade_mail', 'heart', 'lotus_orb'],
        author: 'MeatWagon',
        daysAgo: 19,
        votes: [
            { voterKey: voters.midOrFeed, verdict: Verdict.Positive, hoursAfter: 3 },
            { voterKey: voters.totemPower, verdict: Verdict.Situational, hoursAfter: 8 },
            { voterKey: voters.silentStep, verdict: Verdict.Positive, hoursAfter: 26 },
            { voterKey: voters.kotenok, verdict: Verdict.Negative, hoursAfter: 30 },
            { voterKey: voters.charge, verdict: Verdict.Positive, hoursAfter: 51 },
        ],
        comments: [
            {
                author: 'MidOrFeed',
                text: 'Первые десять минут выглядит как троллинг, но заход из инвиза получается точнее, чем хук через деревья. Хук после этого действительно не обязателен.',
                hoursAfter: 4,
            },
            {
                author: 'd3str0yer',
                text: 'Против команды, которая ставит сентри, разваливается моментально. Зато блейд мейл в связке с ультом окупается честно.',
                hoursAfter: 27,
            },
            {
                author: 'kotenok_v_lesu',
                text: 'Лотус на Пудже это, конечно, сильное заявление. Но если он реально доживает до сердца, вопросов больше нет.',
                hoursAfter: 52,
            },
        ],
    },
    {
        title: 'Шаман первой позиции: змейки фармят, я стою',
        heroId: 'shadow_shaman',
        items: ['power_treads', 'aether_lens', 'manta', 'overwhelming_blink', 'heart'],
        author: 'TotemPower',
        daysAgo: 14,
        votes: [
            { voterKey: voters.silentStep, verdict: Verdict.Situational, hoursAfter: 2 },
            { voterKey: voters.midOrFeed, verdict: Verdict.Situational, hoursAfter: 6 },
            { voterKey: voters.lateGameOnly, verdict: Verdict.Positive, hoursAfter: 19 },
            { voterKey: voters.kotenok, verdict: Verdict.Negative, hoursAfter: 22 },
        ],
        comments: [
            {
                author: 'SilentStep',
                text: 'Змейки сносят бараки быстрее, чем твой керри доходит до них пешком. Вопрос только в том, как пережить лайн.',
                hoursAfter: 3,
            },
            {
                author: 'lategame_only',
                text: 'Играл похожее, но манту брал раньше линзы. Иллюзии дают змейкам ещё пару секунд жизни, пока враг разбирается, кого бить.',
                hoursAfter: 20,
            },
        ],
    },
    {
        title: 'Энигма-керри: лес вместо блэкхола',
        heroId: 'enigma',
        items: ['power_treads', 'bfury', 'arcane_blink', 'blade_mail', 'heart'],
        author: 'BlackHole',
        daysAgo: 9,
        votes: [
            { voterKey: voters.totemPower, verdict: Verdict.Positive, hoursAfter: 5 },
            { voterKey: voters.neonWaltz, verdict: Verdict.Positive, hoursAfter: 12 },
            { voterKey: voters.midOrFeed, verdict: Verdict.Situational, hoursAfter: 15 },
            { voterKey: voters.veinHunter, verdict: Verdict.Positive, hoursAfter: 33 },
            { voterKey: voters.charge, verdict: Verdict.Situational, hoursAfter: 40 },
        ],
        comments: [
            {
                author: 'BlackHole',
                text: 'Идея простая: лес фармят эйдолоны, а не я. Ульт при этом никуда не делся, просто перестаёт быть единственным смыслом героя.',
                hoursAfter: 1,
            },
            {
                author: 'NeonWaltz',
                text: 'Фури первым предметом обязателен, иначе всё это приходит к сороковой минуте и превращается в грустную историю.',
                hoursAfter: 13,
            },
            {
                author: 'vein_hunter',
                text: 'Арканный блинк здесь честно заслужен: заходишь с полной маной, и после ульта ещё остаётся на пульс.',
                hoursAfter: 34,
            },
        ],
    },
    {
        title: 'Лешрак-саппорт, который просто стоит рядом',
        heroId: 'leshrac',
        items: ['power_treads', 'aether_lens', 'pipe', 'lotus_orb', 'overwhelming_blink'],
        author: 'NeonWaltz',
        daysAgo: 6,
        votes: [
            { voterKey: voters.kotenok, verdict: Verdict.Positive, hoursAfter: 4 },
            { voterKey: voters.silentStep, verdict: Verdict.Situational, hoursAfter: 9 },
            { voterKey: voters.lateGameOnly, verdict: Verdict.Negative, hoursAfter: 21 },
        ],
        comments: [
            {
                author: 'TotemPower',
                text: 'Саппорт, который стоит в гуще и не жмёт кнопки, — это либо гений, либо статуя. Но пульс с ультом правда наносят урон сами.',
                hoursAfter: 5,
            },
            {
                author: 'lategame_only',
                text: 'На бумаге красиво, на практике ты без вардов и без спасения. Пайп хотя бы объясняет команде, зачем ты стоишь в файте.',
                hoursAfter: 22,
            },
        ],
    },
    {
        title: 'Кровосек-четвёрка: ульт как стоп-кран',
        heroId: 'bloodseeker',
        items: ['power_treads', 'mask_of_madness', 'blade_mail', 'lotus_orb', 'pipe'],
        author: 'vein_hunter',
        daysAgo: 3,
        votes: [
            { voterKey: voters.midOrFeed, verdict: Verdict.Positive, hoursAfter: 2 },
            { voterKey: voters.charge, verdict: Verdict.Positive, hoursAfter: 7 },
            { voterKey: voters.neonWaltz, verdict: Verdict.Situational, hoursAfter: 11 },
        ],
        comments: [
            {
                author: 'MeatWagon',
                text: 'Разрыв на четвёрке звучит странно ровно до момента, когда враг с блинком остаётся стоять на месте и умирает от твоего керри.',
                hoursAfter: 3,
            },
            {
                author: 'MidOrFeed',
                text: 'Маска сюда просится сама: жажда даёт скорость, чтобы догнать и повесить разрыв, а не бегать за целью полкарты.',
                hoursAfter: 8,
            },
        ],
    },
    {
        title: 'Барати на миде: десолятор вместо рывка',
        heroId: 'spirit_breaker',
        items: ['power_treads', 'mask_of_madness', 'desolator', 'monkey_king_bar', 'satanic'],
        author: 'charge_enjoyer',
        daysAgo: 1,
        votes: [
            { voterKey: voters.totemPower, verdict: Verdict.Situational, hoursAfter: 2 },
            { voterKey: voters.veinHunter, verdict: Verdict.Positive, hoursAfter: 5 },
        ],
        comments: [
            {
                author: 'SilentStep',
                text: 'Мид-Барати живёт ровно до первой руны, но с маской он хотя бы фармит лес между чарджами, а не стоит в лайне без маны.',
                hoursAfter: 4,
            },
            {
                author: 'charge_enjoyer',
                text: 'Десолятор тут не за красоту: минус броня остаётся на цели и работает на всю команду, пока чардж на кд.',
                hoursAfter: 6,
            },
        ],
    },
];
