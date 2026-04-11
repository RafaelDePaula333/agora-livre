// src/lib/insights.ts
import { supabase } from './supabase';

export interface PatternInsight {
  riskDay:   string | null;
  riskTime:  string | null;
  intensity: number;
}

const DAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export async function getPatternInsights(): Promise<PatternInsight> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { riskDay: null, riskTime: null, intensity: 0 };

  // Fetch last 30 days of data that indicate high risk (intensity > 6 or relapses)
  const { data: checkins } = await supabase
    .from('checkins')
    .select('date, urge_intensity')
    .eq('user_id', user.id)
    .gt('urge_intensity', 6)
    .limit(50);

  const { data: relapses } = await supabase
    .from('relapses')
    .select('occurred_at, intensity')
    .eq('user_id', user.id)
    .limit(50);

  const riskEvents: { day: number; hour: number; weight: number }[] = [];

  checkins?.forEach(c => {
    const d = new Date(c.date);
    riskEvents.push({ day: d.getDay(), hour: 12, weight: c.urge_intensity });
  });

  relapses?.forEach(r => {
    const d = new Date(r.occurred_at);
    riskEvents.push({ day: d.getDay(), hour: d.getHours(), weight: 10 });
  });

  if (riskEvents.length === 0) {
    return { riskDay: null, riskTime: null, intensity: 0 };
  }

  // Count day frequency
  const dayCounts: Record<number, number> = {};
  riskEvents.forEach(e => {
    dayCounts[e.day] = (dayCounts[e.day] ?? 0) + e.weight;
  });

  const topDay = Object.keys(dayCounts).reduce((a, b) => 
    dayCounts[Number(a)] > dayCounts[Number(b)] ? a : b
  );

  // Count time of day
  // 0-11: manhã, 12-17: tarde, 18-23: noite
  const periods: Record<string, number> = { 'manhã': 0, 'tarde': 0, 'noite': 0 };
  riskEvents.forEach(e => {
    if (e.hour < 12) periods['manhã'] += e.weight;
    else if (e.hour < 18) periods['tarde'] += e.weight;
    else periods['noite'] += e.weight;
  });

  const topPeriod = Object.keys(periods).reduce((a, b) => 
    periods[a] > periods[b] ? a : b
  );

  return {
    riskDay: DAYS[Number(topDay)],
    riskTime: topPeriod,
    intensity: dayCounts[Number(topDay)]
  };
}
