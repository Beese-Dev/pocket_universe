/** Legacy score for the daily challenge. */
export const DAILY_SPAN=1e9;
export const DAILY_BUDGET={stars:2,holes:1};
export function dailyTotal(sc){ return Math.round(sc.life+sc.alive*50+sc.disc*25); }
