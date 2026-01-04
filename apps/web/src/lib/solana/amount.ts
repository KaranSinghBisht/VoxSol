export function parseUiAmountToBaseUnits(amount: string, decimals: number): bigint {
  const normalized = amount.trim();
  if (normalized.length === 0) {
    throw new Error('amount is required');
  }

  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;

  const [wholePartRaw, fractionalPartRaw = ''] = unsigned.split('.');
  const wholePart = wholePartRaw.length === 0 ? '0' : wholePartRaw;
  const fractionalPart = fractionalPartRaw;

  if (!/^[0-9]+$/.test(wholePart)) {
    throw new Error('invalid amount');
  }
  if (fractionalPart.length > 0 && !/^[0-9]+$/.test(fractionalPart)) {
    throw new Error('invalid amount');
  }

  const whole = BigInt(wholePart);
  const factor = BigInt(10) ** BigInt(decimals);

  const fractionalTruncated = fractionalPart.slice(0, decimals);
  const fractionalPadded = fractionalTruncated.padEnd(decimals, '0');
  const fractional = fractionalPadded.length === 0 ? BigInt(0) : BigInt(fractionalPadded);

  const baseUnits = whole * factor + fractional;
  return negative ? -baseUnits : baseUnits;
}

export function baseUnitsToUiAmount(amount: bigint, decimals: number): string {
  const negative = amount < BigInt(0);
  const unsigned = negative ? -amount : amount;

  const factor = BigInt(10) ** BigInt(decimals);
  const whole = unsigned / factor;
  const fractional = unsigned % factor;

  if (decimals === 0) {
    return `${negative ? '-' : ''}${whole.toString()}`;
  }

  const fractionalStr = fractional.toString().padStart(decimals, '0').replace(/0+$/, '');
  const dot = fractionalStr.length > 0 ? `.${fractionalStr}` : '';
  return `${negative ? '-' : ''}${whole.toString()}${dot}`;
}
