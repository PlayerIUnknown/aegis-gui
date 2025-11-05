import type { ConfigType } from 'dayjs';
import dayjs from './dayjs';

type TimestampInput = string | number | null | undefined;

const tryParse = (value: ConfigType) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

export const parseTimestamp = (input: TimestampInput) => {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === 'number') {
    if (Number.isNaN(input)) {
      return null;
    }

    const numericValue = input > 1e12 ? input : input * 1000;
    return tryParse(numericValue) ?? tryParse(input);
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const direct = tryParse(trimmed);
  if (direct) {
    return direct;
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      const asMilliseconds = trimmed.length <= 10 ? numeric * 1000 : numeric;
      return tryParse(asMilliseconds) ?? tryParse(numeric);
    }
  }

  return null;
};

export const formatTimestamp = (input: TimestampInput, format = 'MMM D, YYYY h:mm A') => {
  const parsed = parseTimestamp(input);
  return parsed ? parsed.format(format) : '—';
};

export const timestampToValue = (input: TimestampInput) =>
  parseTimestamp(input)?.valueOf() ?? Number.NEGATIVE_INFINITY;
