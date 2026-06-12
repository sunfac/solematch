import type { Units } from '@/types/profile';

export const kgFromLb = (lb: number) => lb * 0.45359237;
export const lbFromKg = (kg: number) => kg / 0.45359237;
export const kgFromSt = (st: number, lb = 0) => kgFromLb(st * 14 + lb);
export const kmFromMi = (mi: number) => mi * 1.609344;
export const miFromKm = (km: number) => km / 1.609344;
export const paceSecPerKmFromMinPerMile = (min: number, sec = 0) =>
  (min * 60 + sec) / 1.609344;
export const paceSecPerMileFromSecPerKm = (secPerKm: number) => secPerKm * 1.609344;

export function fmtPace(secPerKm: number, units: Units): string {
  const total = units === 'metric' ? secPerKm : paceSecPerMileFromSecPerKm(secPerKm);
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  const ss = s === 60 ? 0 : s;
  const mm = s === 60 ? m + 1 : m;
  return `${mm}:${String(ss).padStart(2, '0')}/${units === 'metric' ? 'km' : 'mi'}`;
}

export function fmtDist(km: number, units: Units): string {
  if (units === 'metric') return `${Math.round(km * 10) / 10} km`;
  return `${Math.round(miFromKm(km) * 10) / 10} mi`;
}

export function fmtWeight(kg: number, units: Units): string {
  if (units === 'metric') return `${Math.round(kg)} kg`;
  return `${Math.round(lbFromKg(kg))} lb`;
}
