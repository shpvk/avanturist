export type Hero = {
    id: string;
    name: string;
    image: string;
};

/**
 * MVP-каталог героев: статичный список под уже имеющиеся ассеты фронтенда.
 * Позже заменяется импортом из официального каталога Dota 2.
 */
export const HEROES: Hero[] = [
    { id: 'antimage', name: 'Anti-Mage', image: '/assets/heroes/antimage.png' },
    { id: 'bloodseeker', name: 'Bloodseeker', image: '/assets/heroes/bloodseeker.png' },
    { id: 'enigma', name: 'Enigma', image: '/assets/heroes/enigma.png' },
    { id: 'leshrac', name: 'Leshrac', image: '/assets/heroes/leshrac.png' },
    { id: 'phantom_assassin', name: 'Phantom Assassin', image: '/assets/heroes/phantom_assassin.png' },
    { id: 'pudge', name: 'Pudge', image: '/assets/heroes/pudge.png' },
    { id: 'shadow_shaman', name: 'Shadow Shaman', image: '/assets/heroes/shadow_shaman.png' },
    { id: 'spectre', name: 'Spectre', image: '/assets/heroes/spectre.png' },
    { id: 'spirit_breaker', name: 'Spirit Breaker', image: '/assets/heroes/spirit_breaker.png' },
];
