/** Human formatting of simulated years and real seconds. */
export function sig3(v){ return (v<10?v.toFixed(2):v<100?v.toFixed(1):String(Math.round(v))).replace(/\.?0+$/,''); }
export function fmtYears(y){ y=Math.max(0,y); if(y<1) return `${Math.max(1,Math.round(y*365.25))} d`; if(y<1e3) return `${Math.round(y).toLocaleString('en-US')} yr`; if(y<999.5e3) return `${sig3(y/1e3)} kyr`; if(y<999.5e6) return `${sig3(y/1e6)} Myr`; return `${sig3(y/1e9)} Gyr`; }
export function fmtReal(sec){ if(sec<90) return `${Math.max(1,Math.round(sec))} s`; if(sec<5400) return `${(sec/60).toFixed(sec<600?1:0)} min`; if(sec<172800) return `${(sec/3600).toFixed(1)} h`; if(sec<3.2e7) return `${Math.round(sec/86400)} days`; return 'longer than you'; }
