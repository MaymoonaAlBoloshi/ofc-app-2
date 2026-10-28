export const pinAdditions = [
  {
    key: 'executive',
    title: 'Executive summary',
    guidance:
      'Summarise the opportunity, funding requirement, evidence gaps and requested decision without inventing a recommendation.',
  },
  {
    key: 'comparison',
    title: 'Market comparisons',
    guidance:
      'Compare the opportunity with the dated peer research supplied. Distinguish peer figures from opportunity figures.',
  },
  {
    key: 'financial',
    title: 'Financial detail',
    guidance:
      'Explain recorded investment and funding figures, preserving units and periods. Identify absent forecasts or assumptions.',
  },
  {
    key: 'riskDetail',
    title: 'Risk analysis',
    guidance:
      'Explain documented risks and mitigation. Label proposed mitigation as proposed, not implemented.',
  },
];
export function normalizePinOptions(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid PIN choices.');
  const additions = value.additions ?? [],
    additionalRequirements = value.additionalRequirements ?? '';
  if (
    !Array.isArray(additions) ||
    additions.some((key) => !pinAdditions.some((s) => s.key === key))
  )
    throw Error('Choose a listed PIN addition.');
  if (typeof additionalRequirements !== 'string' || additionalRequirements.length > 1500)
    throw Error('Additional requirements must be no longer than 1,500 characters.');
  return {
    additions: pinAdditions.filter((s) => additions.includes(s.key)).map((s) => s.key),
    additionalRequirements: additionalRequirements.trim(),
  };
}
export function optionalPinSections(value) {
  const options = normalizePinOptions(value);
  return [
    ...pinAdditions.filter((s) => options.additions.includes(s.key)),
    ...(options.additionalRequirements
      ? [
          {
            key: 'additional',
            title: 'Additional requirements',
            guidance:
              'Address the requested addition using the source evidence. Flag anything that cannot be supported.',
          },
        ]
      : []),
  ];
}
