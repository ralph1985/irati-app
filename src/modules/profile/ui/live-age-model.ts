import type { BabyAge } from "../domain/baby-profile";

export type AgeUnitKey = "years" | "months" | "days" | "hours" | "minutes" | "seconds";

export type AgeUnit = {
  emphasis: "primary" | "secondary";
  key: AgeUnitKey;
  label: string;
  value: number;
};

const unitDefinitions: Array<{
  emphasis: AgeUnit["emphasis"];
  key: AgeUnitKey;
  plural: string;
  singular: string;
}> = [
  { emphasis: "primary", key: "years", plural: "años", singular: "año" },
  { emphasis: "primary", key: "months", plural: "meses", singular: "mes" },
  { emphasis: "primary", key: "days", plural: "días", singular: "día" },
  { emphasis: "secondary", key: "hours", plural: "horas", singular: "hora" },
  { emphasis: "secondary", key: "minutes", plural: "minutos", singular: "minuto" },
  { emphasis: "secondary", key: "seconds", plural: "segundos", singular: "segundo" },
];

export function getAgeUnits(age: BabyAge): AgeUnit[] {
  return unitDefinitions.map((definition) => ({
    emphasis: definition.emphasis,
    key: definition.key,
    label: age[definition.key] === 1 ? definition.singular : definition.plural,
    value: age[definition.key],
  }));
}

export function formatAgeUnitValue(unit: AgeUnit): string {
  return unit.emphasis === "secondary" ? String(unit.value).padStart(2, "0") : String(unit.value);
}
