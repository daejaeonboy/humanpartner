const COMPONENT_IMAGE_RULES: { pattern: RegExp; src: string }[] = [
  { pattern: /노트북|pc|모니터|데스크탑/i, src: "/comp-notebook.svg" },
  { pattern: /테이블|책상|데스크/i, src: "/comp-table.svg" },
  { pattern: /의자|소파/i, src: "/comp-chair.svg" },
  { pattern: /복합기|프린터|세단기|배너|현수막/i, src: "/comp-printer.svg" },
  { pattern: /냉장고|공기청정기|정수기/i, src: "/comp-fridge.svg" },
  { pattern: /커피|머신|간식|다과/i, src: "/comp-coffee.svg" },
];

const hasValue = (value?: string | null): value is string => Boolean(value?.trim());

export const getComponentFallbackImage = (name?: string | null) => {
  const normalizedName = (name || "").trim();
  if (!normalizedName) return null;

  const matchedRule = COMPONENT_IMAGE_RULES.find(({ pattern }) =>
    pattern.test(normalizedName),
  );

  return matchedRule?.src ?? null;
};

export const resolveComponentImageUrl = (
  name?: string | null,
  ...candidates: Array<string | null | undefined>
) => {
  const preferredImage = candidates.find(hasValue);
  return preferredImage ?? getComponentFallbackImage(name);
};

export const applyComponentImageFallback = (
  imageElement: HTMLImageElement,
  name?: string | null,
) => {
  const fallbackImage = getComponentFallbackImage(name);

  if (
    fallbackImage &&
    imageElement.dataset.fallbackApplied !== "true" &&
    imageElement.currentSrc !== fallbackImage
  ) {
    imageElement.dataset.fallbackApplied = "true";
    imageElement.src = fallbackImage;
    return;
  }

  imageElement.style.display = "none";
  imageElement.parentElement?.classList.add("fallback-icon");
};
